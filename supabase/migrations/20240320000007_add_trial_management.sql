-- Add trial management fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_history JSONB DEFAULT '[]'::jsonb;

-- Add trial management fields to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS can_downgrade BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS downgrade_available_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster trial lookups
CREATE INDEX IF NOT EXISTS idx_profiles_trial_used ON public.profiles(trial_used);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_dates ON public.subscriptions(trial_started_at, trial_ended_at);

-- Update the handle_subscription_update function to handle trial management
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
    v_is_trial BOOLEAN;
    v_trial_history JSONB;
BEGIN
    -- Determine if this is a trial subscription
    v_is_trial := p_plan_type = 'trial';

    -- Get current trial history
    SELECT trial_history INTO v_trial_history
    FROM public.profiles
    WHERE id = p_user_id;

    -- Update or insert subscription
    INSERT INTO public.subscriptions (
        user_id,
        status,
        plan_type,
        stripe_subscription_id,
        stripe_customer_id,
        current_period_end,
        trial_started_at,
        trial_ended_at,
        can_downgrade,
        downgrade_available_at
    )
    VALUES (
        p_user_id,
        p_status,
        p_plan_type,
        p_subscription_id,
        p_customer_id,
        p_current_period_end,
        CASE WHEN v_is_trial THEN NOW() ELSE NULL END,
        CASE WHEN v_is_trial THEN p_current_period_end ELSE NULL END,
        CASE 
            WHEN p_plan_type = 'yearly' THEN FALSE
            WHEN p_plan_type = 'monthly' THEN TRUE
            ELSE NULL
        END,
        CASE 
            WHEN p_plan_type = 'yearly' THEN p_current_period_end
            ELSE NULL
        END
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        status = p_status,
        plan_type = p_plan_type,
        stripe_subscription_id = p_subscription_id,
        stripe_customer_id = p_customer_id,
        current_period_end = p_current_period_end,
        trial_started_at = CASE 
            WHEN v_is_trial AND subscriptions.trial_started_at IS NULL THEN NOW()
            ELSE subscriptions.trial_started_at
        END,
        trial_ended_at = CASE 
            WHEN v_is_trial THEN p_current_period_end
            ELSE subscriptions.trial_ended_at
        END,
        can_downgrade = CASE 
            WHEN p_plan_type = 'yearly' THEN FALSE
            WHEN p_plan_type = 'monthly' THEN TRUE
            ELSE subscriptions.can_downgrade
        END,
        downgrade_available_at = CASE 
            WHEN p_plan_type = 'yearly' THEN p_current_period_end
            ELSE subscriptions.downgrade_available_at
        END,
        updated_at = NOW()
    RETURNING to_json(subscriptions.*) INTO v_subscription;

    -- Update profile with trial information
    UPDATE public.profiles
    SET
        subscription_status = p_status,
        subscription_plan = p_plan_type,
        trial_used = CASE 
            WHEN v_is_trial THEN TRUE
            ELSE trial_used
        END,
        trial_used_at = CASE 
            WHEN v_is_trial AND trial_used_at IS NULL THEN NOW()
            ELSE trial_used_at
        END,
        trial_history = CASE 
            WHEN v_is_trial THEN 
                COALESCE(trial_history, '[]'::jsonb) || 
                jsonb_build_object(
                    'started_at', NOW(),
                    'ended_at', p_current_period_end,
                    'status', p_status
                )
            ELSE trial_history
        END,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING to_json(profiles.*) INTO v_profile;

    RETURN json_build_object(
        'subscription', v_subscription,
        'profile', v_profile
    );
END;
$$; 