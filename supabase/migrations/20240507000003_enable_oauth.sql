-- This migration enables OAuth providers in your Supabase project
-- Note: You'll need to configure the OAuth providers in the Supabase dashboard
-- after running this migration

-- Create a trigger to handle OAuth users
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract name from user metadata or use email as fallback
  DECLARE
    user_name TEXT;
  BEGIN
    -- Try to get name from user metadata
    IF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSE
      -- Fallback to email
      user_name := split_part(NEW.email, '@', 1);
    END IF;

    -- Insert into profiles if not exists
    INSERT INTO public.profiles (id, name, email)
    VALUES (NEW.id, user_name, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into user_progress if not exists
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;

-- Create trigger for OAuth users
CREATE TRIGGER on_oauth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'provider' IS NOT NULL)
  EXECUTE FUNCTION public.handle_oauth_user();
