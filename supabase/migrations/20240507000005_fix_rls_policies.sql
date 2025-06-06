-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create new policies for profiles
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create new policies for user_progress
CREATE POLICY "Enable read access for authenticated users"
ON public.user_progress FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.user_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
ON public.user_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;

-- Update the trigger function to use service_role
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

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_creation();

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.handle_user_creation() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_creation() TO postgres; 