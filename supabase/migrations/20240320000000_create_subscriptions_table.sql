-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    subscription_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Create function to handle subscription updates
CREATE OR REPLACE FUNCTION public.handle_subscription_update(
    p_user_id UUID,
    p_subscription_id TEXT,
    p_customer_id TEXT,
    p_plan_type TEXT,
    p_status TEXT,
    p_current_period_end TIMESTAMPTZ
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_subscription JSON;
    v_profile JSON;
BEGIN
    -- Update or insert subscription
    INSERT INTO public.subscriptions (
        user_id,
        status,
        plan_type,
        stripe_subscription_id,
        stripe_customer_id,
        current_period_end
    )
    VALUES (
        p_user_id,
        p_status,
        p_plan_type,
        p_subscription_id,
        p_customer_id,
        p_current_period_end
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        status = p_status,
        plan_type = p_plan_type,
        stripe_subscription_id = p_subscription_id,
        stripe_customer_id = p_customer_id,
        current_period_end = p_current_period_end,
        updated_at = NOW()
    RETURNING to_json(subscriptions.*) INTO v_subscription;

    -- Update profile
    UPDATE public.profiles
    SET
        subscription_status = p_status,
        subscription_plan = p_plan_type,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING to_json(profiles.*) INTO v_profile;

    RETURN json_build_object(
        'subscription', v_subscription,
        'profile', v_profile
    );
END;
$$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DO $$ 
BEGIN
    -- Drop triggers if they exist
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        DROP TRIGGER update_profiles_updated_at ON public.profiles;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_progress_updated_at'
    ) THEN
        DROP TRIGGER update_user_progress_updated_at ON public.user_progress;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_subscriptions_updated_at'
    ) THEN
        DROP TRIGGER update_subscriptions_updated_at ON public.subscriptions;
    END IF;
END $$;

-- Create new triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

        CREATE TRIGGER update_subscriptions_updated_at
            BEFORE UPDATE ON public.subscriptions
            FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 