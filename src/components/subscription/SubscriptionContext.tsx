"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/lib/supabase";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "inactive" | null;
export type PlanType = "free" | "trial" | "student" | "student_yearly" | "classroom" | null;

export type Subscription = {
  status: SubscriptionStatus;
  planType: PlanType;
  currentPeriodEnd: string;
  subscriptionId: string;
  cancel_at_period_end: boolean;
  plan_type: PlanType;
  current_period_end: string;
  created_at: string;
} | null;

type SubscriptionContextType = {
  subscription: Subscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  forceRefreshSubscription: () => Promise<void>;
  isInTrialPeriod: boolean;
  hasPremiumAccess: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { user } = useAuth();

  const isInTrialPeriod = subscription?.planType === "trial" && 
    subscription?.status === "active" && 
    new Date(subscription.currentPeriodEnd) > new Date();

  const hasPremiumAccess = subscription?.status === "active" && 
    (subscription?.planType === "student" || 
     subscription?.planType === "student_yearly" ||
     subscription?.planType === "classroom" || 
     isInTrialPeriod);

  // Add real-time subscription updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user:', user.id);

    // Set up real-time subscription for the user
    const subscriptionChannel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Real-time subscription update:', payload);
          // Refresh subscription data when changes occur
          await fetchSubscription();
        }
      )
      .subscribe();

    // Set up real-time profile updates
    const profileChannel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Real-time profile update:', payload);
          // Refresh subscription data when profile changes
          await fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscriptionChannel.unsubscribe();
      profileChannel.unsubscribe();
    };
  }, [user]);

  const fetchSubscription = async () => {
    if (!user || isFetching) {
      return;
    }

    setIsFetching(true);
    try {
      console.log('Fetching subscription for user:', user.id);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No subscription found for user:', user.id);
          setSubscription(null);
        } else {
          console.error("Error fetching subscription:", {
            error,
            code: error.code,
            message: error.message,
            details: error.details
          });
          setSubscription(null);
        }
      } else if (data) {
        console.log('Subscription data retrieved:', {
          status: data.status,
          planType: data.plan_type,
          currentPeriodEnd: data.current_period_end,
          cancel_at_period_end: data.cancel_at_period_end
        });

        // Validate subscription data
        if (!data.status || !data.plan_type || !data.current_period_end) {
          console.error('Invalid subscription data:', data);
          setSubscription(null);
          return;
        }

        setSubscription({
          status: data.status,
          planType: data.plan_type as PlanType,
          currentPeriodEnd: data.current_period_end,
          subscriptionId: data.stripe_subscription_id,
          cancel_at_period_end: data.cancel_at_period_end || false,
          plan_type: data.plan_type as PlanType,
          current_period_end: data.current_period_end,
          created_at: data.created_at
        });
      } else {
        console.log('No subscription data returned');
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error in subscription fetch:", error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  // Add a function to force refresh subscription
  const forceRefreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
  };

  // Modify the refreshSubscription function to be more robust
  const refreshSubscription = async () => {
    if (!isFetching) {
      await forceRefreshSubscription();
    }
  };

  // Add subscription status check with validation
  useEffect(() => {
    if (subscription) {
      // Validate subscription data
      if (!subscription.status || !subscription.planType || !subscription.currentPeriodEnd) {
        console.error('Invalid subscription data in context:', subscription);
        setSubscription(null);
        return;
      }

      console.log('Subscription status changed:', {
        status: subscription.status,
        planType: subscription.planType,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isInTrialPeriod,
        hasPremiumAccess
      });
    }
  }, [subscription]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        refreshSubscription,
        fetchSubscription,
        forceRefreshSubscription,
        isInTrialPeriod,
        hasPremiumAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
} 