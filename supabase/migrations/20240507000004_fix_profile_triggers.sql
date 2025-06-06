-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_email_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_oauth_user();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a single function to handle all user creation
CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract name from user metadata or use email as fallback
  DECLARE
    user_name TEXT;
    user_avatar TEXT;
    existing_user_id UUID;
  BEGIN
    -- Check if email already exists
    SELECT id INTO existing_user_id
    FROM public.profiles
    WHERE email = NEW.email;

    -- If email exists and it's not the current user, prevent the insert
    IF existing_user_id IS NOT NULL AND existing_user_id != NEW.id THEN
      RAISE EXCEPTION 'Email % is already registered', NEW.email;
    END IF;

    -- Try to get name from user metadata
    IF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSE
      -- Fallback to email
      user_name := split_part(NEW.email, '@', 1);
    END IF;

    -- Get avatar URL if available
    user_avatar := NEW.raw_user_meta_data->>'avatar_url';

    -- Insert into profiles if not exists
    INSERT INTO public.profiles (
      id, 
      name, 
      email, 
      avatar_url,
      subscription_status,
      subscription_plan
    )
    VALUES (
      NEW.id, 
      user_name, 
      NEW.email, 
      user_avatar,
      'inactive',
      'free'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
      updated_at = NOW();
    
    -- Insert into user_progress if not exists
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single trigger for all user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_creation();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_user_creation() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_creation() TO postgres; 