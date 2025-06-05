'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/components/subscription/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [isUpdate, setIsUpdate] = useState(false);

  const handleFetchSubscription = useCallback(async () => {
    try {
      // Check if this is a subscription update
      const subscriptionUpdated = searchParams.get('subscription_updated') === 'true';
      const subscriptionId = searchParams.get('subscription_id');
      const sessionId = searchParams.get('session_id');
      
      setIsUpdate(subscriptionUpdated);

      if (subscriptionUpdated && subscriptionId) {
        console.log('Processing subscription update:', { subscriptionId });
      } else if (sessionId) {
        console.log('Processing new subscription:', { sessionId });
      }

      // Wait a moment to ensure Stripe webhook has processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchSubscription();
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('There was an error processing your payment. Please contact support.');
      setIsLoading(false);
    }
  }, [fetchSubscription, searchParams]);

  useEffect(() => {
    handleFetchSubscription();
  }, [handleFetchSubscription]);

  // Handle redirect countdown
  useEffect(() => {
    if (isLoading || error) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Use setTimeout to ensure the state update is complete before navigation
          setTimeout(() => {
            router.push('/');
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <CardTitle>
              {isUpdate ? 'Subscription Updated!' : 'Payment Successful!'}
            </CardTitle>
          </div>
          <CardDescription>
            {isUpdate 
              ? 'Your subscription has been updated successfully'
              : 'Thank you for your subscription'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {isUpdate
              ? 'Your subscription changes have been applied. You will be charged the new rate at your next billing date.'
              : 'Your subscription has been activated. You now have access to all premium features.'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Redirecting to home page in {redirectCountdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 