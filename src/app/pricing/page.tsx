"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, XCircle, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useSubscription } from "@/components/subscription/SubscriptionContext";
import AuthModal from "@/components/auth/AuthModal";
import { supabase } from "@/lib/supabase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToDashboard } from "@/components/ui/back-to-dashboard";

interface Plan {
  name: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted: boolean;
  priceId: string | null;
  isYearly: boolean;
  savings?: string;
  comingSoon?: boolean;
}

// Add PricingSkeleton component
const PricingSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header Skeleton */}
    <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-32" />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <main className="flex-1">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section Skeleton */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-6 w-full mx-auto mb-6" />
          <div className="bg-muted/50 p-6 rounded-lg max-w-2xl mx-auto mt-6">
            <Skeleton className="h-6 w-48 mx-auto mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-full max-w-sm">
              <CardHeader>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section Skeleton */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);

export default function PricingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const { user, login, register, loginWithGoogle } = useAuth();
  const { subscription, isInTrialPeriod, hasPremiumAccess, fetchSubscription } = useSubscription();
  const router = useRouter();
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isNavigatingToProfile, setIsNavigatingToProfile] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const [pendingTrialStart, setPendingTrialStart] = useState(false);

  console.log('PricingPage initial render. isStartingTrial:', isStartingTrial, 'pendingTrialStart:', pendingTrialStart, 'user:', !!user);

  // Simplified effect to just check trial history
  useEffect(() => {
    const checkTrialHistory = async () => {
      if (!user) {
        console.log('No user, setting hasUsedTrial to false');
        setHasUsedTrial(false);
        return;
      }

      try {
        console.log('Checking trial history for user:', user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("trial_used")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking trial history:", error);
          return;
        }

        console.log('Trial history check result:', data);
        const hasTrial = data?.trial_used === true;
        console.log('Setting hasUsedTrial to:', hasTrial);
        setHasUsedTrial(hasTrial);
      } catch (error) {
        console.error("Error in trial history check:", error);
      }
    };

    checkTrialHistory();
  }, [user]);

  // Add a debug effect to monitor hasUsedTrial changes
  useEffect(() => {
    console.log('hasUsedTrial state changed to:', hasUsedTrial);
  }, [hasUsedTrial]);

  // Add loading state effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Add effect to handle trial start after successful authentication
  useEffect(() => {
    if (user && pendingTrialStart) {
      handleStartFreeTrial();
    }
  }, [user, pendingTrialStart]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      setIsStartingTrial(false);
      setPendingTrialStart(false);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    return login(email, password);
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
  ) => {
    return register(email, password, name);
  };

  const handleNavigation = (path: string, setLoadingState: (value: boolean) => void) => {
    setLoadingState(true);
    setTimeout(() => {
      router.push(path);
    }, 500);
  };

  const handleStartFreeTrial = async () => {
    if (!user) {
      setPendingTrialStart(true);
      setIsAuthModalOpen(true);
      return;
    }

    if (hasUsedTrial) {
      toast({
        variant: "destructive",
        title: "Trial Already Used",
        description: "You have already used your free trial. Please choose a subscription plan to continue.",
        duration: 5000,
      });
      return;
    }

    setIsStartingTrial(true);
    try {
      const response = await fetch('/api/subscriptions/create-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trial subscription');
      }

      await fetchSubscription();
      toast({
        title: "Trial Started",
        description: "Your 7-day free trial has been activated. Enjoy your premium features!",
        duration: 5000,
      });
      router.push('/');
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        variant: "destructive",
        title: "Error Starting Trial",
        description: error instanceof Error ? error.message : 'Failed to start trial. Please try again or contact support.',
        duration: 5000,
      });
    } finally {
      setIsStartingTrial(false);
      setPendingTrialStart(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubscribing(priceId);
    try {
      logger.info('Creating payment link', { priceId, userId: user.id, email: user.email });
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      let errorMessage = 'An unexpected error occurred. Please try again.';
      let data;
      
      try {
        data = await response.json();
      } catch (parseError) {
        logger.error('Error parsing server response', { 
          error: parseError,
          status: response.status,
          statusText: response.statusText
        });
        
        if (response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (response.status >= 500) {
          errorMessage = 'Our servers are experiencing issues. Please try again later.';
        }
        throw new Error(errorMessage);
      }
      
      if (!response.ok) {
        // Log the error with structured data
        logger.error('Subscription error response', {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          message: data?.message,
          downgrade_available_at: data?.downgrade_available_at
        });
        
        // Handle specific error cases
        if (response.status === 403 && data?.downgrade_available_at) {
          const downgradeDate = new Date(data.downgrade_available_at);
          const formattedDate = downgradeDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          setErrorMessage(`You can only downgrade at the end of your billing period (${formattedDate}).`);
          setErrorDialogOpen(true);
          return;
        }
        
        // Use server error message if available, otherwise use status text
        errorMessage = data?.error || data?.message || response.statusText || 'Failed to create payment link';
        throw new Error(errorMessage);
      }

      if (!data?.url) {
        logger.error('No payment URL in response', { data });
        throw new Error('No payment URL received from server');
      }

      // Log successful payment link creation
      logger.info('Payment link created successfully', { url: data.url });
      
      // Redirect to Stripe Payment Link
      window.location.href = data.url;
    } catch (error) {
      logger.error('Error creating payment link', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show error in toast with appropriate styling
      toast({
        variant: "destructive",
        title: "Subscription Error",
        description: error instanceof Error ? error.message : 'Failed to create payment link. Please try again or contact support.',
        duration: 5000,
      });
    } finally {
      setIsSubscribing(null);
    }
  };

  const getPlanButtonText = (planName: string, isYearly?: boolean) => {
    if (!user) return isYearly ? "Subscribe Yearly" : "Get Started";
    
    // For free trial plan
    if (planName.toLowerCase() === "free trial") {
      if (subscription?.plan_type === "trial" && subscription?.status === "active") {
        return "Current Plan";
      }
      return hasUsedTrial ? "Trial Used" : "Start Free Trial";
    }
    
    // For Student plans (both monthly and yearly)
    if (planName.toLowerCase() === "student") {
      // If checking yearly plan
      if (isYearly) {
        return subscription?.plan_type === "student_yearly" && subscription?.status === "active"
          ? "Current Plan"
          : "Subscribe Yearly";
      }
      // If checking monthly plan
      return subscription?.plan_type === "student" && subscription?.status === "active"
        ? "Current Plan"
        : "Subscribe Now";
    }
    
    // For other plans
    return subscription?.plan_type === planName.toLowerCase() && subscription?.status === "active"
      ? "Current Plan"
      : "Contact Sales";
  };

  const getPlanButtonVariant = (planName: string) => {
    if (!user) return "default";
    const planType = planName.toLowerCase();
    
    // For trial plan
    if (planType === "free trial") {
      return subscription?.plan_type === "trial" && subscription?.status === "active"
        ? "secondary"
        : "default";
    }
    
    // For student plans
    if (planType === "student") {
      return subscription?.plan_type === "student" && subscription?.status === "active"
        ? "secondary"
        : "default";
    }
    
    return "default";
  };

  const isPlanActive = (planName: string, isYearly?: boolean) => {
    if (!subscription) return false;
    
    // For free trial plan
    if (planName.toLowerCase() === "free trial") {
      return subscription.plan_type === "trial" && subscription.status === "active";
    }
    
    // For Student plans (both monthly and yearly)
    if (planName.toLowerCase() === "student") {
      // If checking yearly plan
      if (isYearly) {
        return subscription.plan_type === "student_yearly" && subscription.status === "active";
      }
      // If checking monthly plan
      return subscription.plan_type === "student" && subscription.status === "active";
    }
    
    // For other plans
    return subscription.plan_type === planName.toLowerCase() && subscription.status === "active";
  };

  const plans: Plan[] = [
    {
      name: "Free Trial",
      price: "$0",
      duration: "7 days",
      description: hasUsedTrial ? "You have already used your free trial" : "Experience the power of AI-guided learning",
      features: [
        "AI Study Buddy (limited interactions)",
        "Basic practice questions",
        "Access to previous AP CS A questions",
        "Smart filtering by topic and difficulty",
        "Topic-based organization",
        "Interactive code editor",
        "Basic feedback on submissions",
        "Quick reference cards",
        "One-time trial only",
      ],
      buttonText: hasUsedTrial ? "Trial Used" : "Start Free Trial",
      highlighted: false,
      priceId: null,
      isYearly: false,
      comingSoon: hasUsedTrial,
    },
    {
      name: "Student",
      price: "$9.99",
      duration: "month",
      description: "Full access to AI-powered learning",
      features: [
        "AI Study Buddy with unlimited interactions",
        "Personalized study guidance",
        "Step-by-step problem solving help",
        "Code review and optimization tips",
        "Concept clarification on demand",
        "Unlimited practice questions",
        "Advanced filtering and organization",
        "AI-generated similar practice questions",
        "Detailed progress analytics",
        "Full access to all MCQs and FRQs",
        "Advanced code evaluation",
        "Priority email support",
      ],
      buttonText: "Subscribe Now",
      highlighted: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRICE_ID || null,
      isYearly: false,
    },
    {
      name: "Student",
      price: "$99.99",
      duration: "year",
      description: "Best value for dedicated students",
      features: [
        "Everything in monthly plan",
        "Save 17% compared to monthly",
        "Lock in current price for 12 months",
        "Custom study plan adjustments",
        "Early access to new features",
        "Priority support with 24-hour response time",
      ],
      buttonText: "Subscribe Yearly",
      highlighted: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_YEARLY_PRICE_ID || null,
      isYearly: true,
      savings: "Save $19.89/year",
    },
    {
      name: "Classroom",
      price: "Coming Soon",
      duration: "contact sales",
      description: "Complete learning solution for teachers",
      features: [
        "Everything in Student plan",
        "AI Study Buddy for each student",
        "Teacher dashboard with AI insights",
        "Class-wide progress analytics",
        "Up to 30 student accounts",
        "Assignment creation tools",
        "Custom practice sets",
        "Advanced filtering and organization",
        "AI-generated similar practice questions",
        "Priority support",
        "Custom onboarding",
      ],
      buttonText: "Contact Sales",
      highlighted: false,
      priceId: null,
      comingSoon: true,
      isYearly: false,
    },
  ];

  // Show skeleton while loading
  if (isPageLoading) {
    return <PricingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <BackToDashboard />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="text-lg font-semibold">Pricing Plans</h1>
            </div>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation("/profile", setIsNavigatingToProfile)}
                disabled={isNavigatingToHome || isNavigatingToProfile || isSubscribing !== null || isStartingTrial}
              >
                {isNavigatingToProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading...</span>
                  </>
                ) : (
                  "Profile"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Excel in AP CS A with Your AI Study Buddy
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Get personalized guidance and instant feedback as you practice. Our AI Study Buddy helps you understand concepts, review code, and prepare effectively for the AP Computer Science A exam.
            </p>
            
            {/* Only show trial period message if currently in trial */}
            {isInTrialPeriod && subscription?.current_period_end && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg inline-block">
                <p className="text-primary font-medium">
                  Your trial period ends in {Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}

            <div className="bg-muted/50 p-6 rounded-lg max-w-2xl mx-auto mt-6">
              <h2 className="text-lg font-semibold mb-3">Why Choose AP CompTutor?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">AI-Powered Learning</h3>
                    <p className="text-sm text-muted-foreground">Get instant help and personalized guidance from your AI Study Buddy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Smart Practice Organization</h3>
                    <p className="text-sm text-muted-foreground">Easily access and filter previous AP CS A questions by topic, difficulty, and type</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Topic-Based Learning</h3>
                    <p className="text-sm text-muted-foreground">Focus on specific areas like Arrays, OOP, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Quick Reference</h3>
                    <p className="text-sm text-muted-foreground">Access concise summaries of key concepts anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto justify-items-center">
            {plans.map((plan: Plan, index: number) => {
              // Add a check here to target only the Free Trial plan for logging (can be removed after debugging)
              if (plan.name === "Free Trial") {
                console.log('Free Trial button rendering logic:');
                console.log('  isSubscribing:', isSubscribing);
                console.log('  plan.priceId:', plan.priceId);
                console.log('  isStartingTrial:', isStartingTrial);
                console.log('  isSubscribing === plan.priceId:', isSubscribing === plan.priceId);
                console.log('  isStartingTrial && !plan.priceId:', isStartingTrial && !plan.priceId);
              }

              return (
                <Card
                  key={index}
                  className={`flex flex-col relative w-full max-w-sm ${
                    plan.highlighted
                      ? "border-primary shadow-lg"
                      : plan.comingSoon
                        ? "border-muted-foreground/20 opacity-75"
                        : ""
                  }`}
                >
                  {plan.comingSoon && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-muted-foreground/10 text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
                        {plan.name === "Free Trial" ? "Trial Used" : "Coming Soon"}
                      </div>
                    </div>
                  )}
                  {plan.isYearly && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1 rounded-full text-sm font-medium">
                        Best Value
                      </div>
                    </div>
                  )}
                  <CardHeader className={plan.comingSoon ? "opacity-75" : ""}>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {plan.name}
                      {plan.isYearly && (
                        <span className="text-sm font-normal text-muted-foreground">(Yearly)</span>
                      )}
                    </CardTitle>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        {!plan.comingSoon && (
                          <span className="text-muted-foreground">/{plan.duration}</span>
                        )}
                      </div>
                      {plan.savings && (
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {plan.savings}
                        </div>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={`flex-grow ${plan.comingSoon ? "opacity-75" : ""}`}>
                    <ul className="space-y-3">
                      {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className={plan.comingSoon ? "opacity-75" : ""}>
                    {plan.comingSoon ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => window.location.href = "mailto:sales@apcomptutor.com"}
                        disabled={isSubscribing !== null || isStartingTrial}
                      >
                        Contact Sales
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={getPlanButtonVariant(plan.name)}
                        onClick={() => {
                          if (plan.priceId) {
                            handleSubscribe(plan.priceId);
                          } else {
                            handleStartFreeTrial();
                          }
                        }}
                        disabled={
                          isPlanActive(plan.name, plan.isYearly) ||
                          isSubscribing !== null ||
                          isStartingTrial ||
                          isNavigatingToHome ||
                          isNavigatingToProfile
                        }
                      >
                        {/* Adjusted conditional rendering for button text */}
                        {
                          plan.name === "Free Trial" && isStartingTrial ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Starting Trial...</span>
                            </>
                          ) : plan.priceId !== null && isSubscribing === plan.priceId ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            getPlanButtonText(plan.name, plan.isYearly)
                          )
                        }
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">
                  100% Satisfaction Guarantee
                </h2>
                <p className="text-sm text-muted-foreground">
                  Not satisfied with your subscription? Contact us within 30 days of
                  purchase for a full refund.
                </p>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">
                  Need Help Choosing?
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Our team is here to help you find the perfect plan for your needs.
                </p>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "mailto:support@apcomptutor.com"}>
                  Contact Support
                </Button>
              </div>
            </div>
          </div>

          {/* Simplified FAQ section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">About Our Plans</h2>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Choose the plan that best fits your learning needs. Our monthly and yearly subscriptions give you full access to all premium features, including unlimited AI Study Buddy interactions, personalized study guidance, and comprehensive practice materials.
                  </p>
                  <p>
                    Need help choosing? Contact our support team for personalized recommendations based on your learning goals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What happens when I cancel my subscription?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>For monthly subscriptions:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Cancellation takes effect immediately</li>
                    <li>You will lose access to premium features right away</li>
                    <li>No refunds are provided for unused time</li>
                  </ul>
                  <p className="mt-2">For yearly subscriptions:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You maintain access until the end of your current billing period</li>
                    <li>No automatic renewal will occur</li>
                    <li>You can resubscribe at any time</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Can I get a refund if I cancel?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Our refund policy is as follows:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Monthly subscriptions: No refunds for unused time</li>
                    <li>Yearly subscriptions: No refunds for unused time</li>
                    <li>Free trial: No refunds as it's already free</li>
                  </ul>
                  <p className="mt-2">We recommend trying our free trial before committing to a paid plan to ensure our service meets your needs.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What is the free trial and how does it work?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Our free trial offers:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Full access to all premium features</li>
                    <li>No credit card required to start</li>
                    <li>Limited to one trial per user</li>
                    <li>Automatic conversion to paid plan after trial ends</li>
                  </ul>
                  <p className="mt-2">Note: Once you've used your free trial, you won't be eligible for another one. This helps us maintain fair usage of our service.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>What's the difference between monthly and yearly plans?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Key differences:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Yearly plans offer significant savings compared to monthly plans</li>
                    <li>Monthly plans provide more flexibility with immediate cancellation</li>
                    <li>Both plans include the same premium features</li>
                    <li>Yearly plans are ideal for long-term commitment</li>
                  </ul>
                  <p className="mt-2">You can upgrade from monthly to yearly at any time to take advantage of the savings.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Can I switch between plans?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Plan switching options:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Upgrade from monthly to yearly: Available immediately</li>
                    <li>Downgrade from yearly to monthly: Takes effect at the end of your current billing period</li>
                    <li>Switching between different tiers: Available immediately for upgrades, end of period for downgrades</li>
                  </ul>
                  <p className="mt-2">All plan changes can be managed from your profile settings.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>We accept all major payment methods:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Credit/Debit cards (Visa, Mastercard, American Express)</li>
                    <li>Secure payment processing through Stripe</li>
                    <li>Automatic billing for subscription renewals</li>
                  </ul>
                  <p className="mt-2">All payments are processed securely and encrypted. We never store your full card details.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>AP CompTutor &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingTrialStart(false);
          setIsStartingTrial(false);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={loginWithGoogle}
      />

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Subscription Change Not Available
            </DialogTitle>
            <DialogDescription className="pt-4">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setErrorDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setErrorDialogOpen(false);
                router.push('/profile');
              }}
              className="w-full sm:w-auto"
            >
              View Subscription Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
