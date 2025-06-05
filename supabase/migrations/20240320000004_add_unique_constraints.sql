-- First, clean up duplicate subscriptions by keeping only the most recent one for each user
WITH ranked_subscriptions AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);

-- Now we can safely add the unique constraint
ALTER TABLE public.subscriptions
ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);

-- Add unique constraint to prevent duplicate emails in profiles
ALTER TABLE public.profiles
ADD CONSTRAINT unique_email UNIQUE (email);

-- Update the OAuth trigger to handle email conflicts
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
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

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_email_user_created ON auth.users;

-- Recreate triggers
CREATE TRIGGER on_oauth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'provider' IS NOT NULL)
  EXECUTE FUNCTION public.handle_oauth_user();

CREATE TRIGGER on_email_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'provider' IS NULL)
  EXECUTE FUNCTION public.handle_oauth_user(); 