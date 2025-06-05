-- This migration enables OAuth providers in your Supabase project
-- Note: You'll need to configure the OAuth providers in the Supabase dashboard
-- after running this migration

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_questions INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 50,
    mcqs_correct TEXT DEFAULT '0%',
    frqs_attempted TEXT DEFAULT '0',
    study_time TEXT DEFAULT '0 hrs',
    strong_topics TEXT[] DEFAULT '{}',
    weak_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own progress"
    ON public.user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON public.user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Create a trigger to handle OAuth users
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract name from user metadata or use email as fallback
  DECLARE
    user_name TEXT;
    user_avatar TEXT;
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

    -- Get avatar URL if available
    user_avatar := NEW.raw_user_meta_data->>'avatar_url';

    -- Insert into profiles if not exists
    INSERT INTO public.profiles (id, name, email, avatar_url)
    VALUES (NEW.id, user_name, NEW.email, user_avatar)
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;

-- Create trigger for OAuth users
CREATE TRIGGER on_oauth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'provider' IS NOT NULL)
  EXECUTE FUNCTION public.handle_oauth_user();

-- Create trigger for email/password users
CREATE TRIGGER on_email_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'provider' IS NULL)
  EXECUTE FUNCTION public.handle_oauth_user();
