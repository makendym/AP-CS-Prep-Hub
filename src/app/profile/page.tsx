"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useSubscription, Subscription, SubscriptionStatus, PlanType } from "@/components/subscription/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User, Mail, BookOpen, Clock, Target, AlertCircle, ArrowLeft, CreditCard, CheckCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToDashboard } from "@/components/ui/back-to-dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
};

type UserProgress = {
  completed_questions: number;
  total_questions: number;
  mcqs_correct: string;
  frqs_attempted: string;
  study_time: string;
  strong_topics: string[];
  weak_topics: string[];
};

interface SubscriptionBadgeProps {
  subscription: NonNullable<Subscription>;
  isActive: boolean;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ subscription, isActive }) => {
  // Add debug logging
  console.log('SubscriptionBadge props:', {
    subscription: {
      plan_type: subscription.plan_type,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      created_at: subscription.created_at,
      cancel_at_period_end: subscription.cancel_at_period_end
    },
    isActive
  });

  const planName = subscription.plan_type === "student_yearly" ? "Student Yearly" :
                  subscription.plan_type === "student" ? "Student Monthly" :
                  subscription.plan_type === "trial" ? "Trial" :
                  subscription.plan_type === "classroom" ? "Classroom" : "Free";

  // If it's a trial subscription
  if (subscription.plan_type === "trial" && isActive && subscription.current_period_end) {
    const currentPeriodEnd = new Date(subscription.current_period_end);
    const daysLeft = Math.ceil((currentPeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    // Validate days left
    if (isNaN(daysLeft) || daysLeft < 0) {
      console.error('Invalid trial period end date:', subscription.current_period_end);
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="ml-2">
            Trial Expired
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="ml-2">
          {planName} Plan
          <span className="ml-1">
            ({daysLeft} days left)
          </span>
        </Badge>
      </div>
    );
  }
  
  // For paid subscriptions
  let endDate: Date | null = null;
  
  // For yearly plans that are active and not cancelled, calculate renewal date from current_period_end
  if (subscription.plan_type === "student_yearly" && isActive && !subscription.cancel_at_period_end && subscription.current_period_end) {
    const currentPeriodEnd = new Date(subscription.current_period_end);
    endDate = new Date(currentPeriodEnd);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    console.log('Yearly plan renewal calculation:', {
      current_period_end: subscription.current_period_end,
      renewalDate: endDate.toISOString(),
      now: new Date().toISOString()
    });
  } else if (subscription.current_period_end) {
    // For all other cases, use current_period_end
    endDate = new Date(subscription.current_period_end);
  }
  
  // For free plan, just show the badge without any date
  if (subscription.plan_type === "free") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={isActive ? "default" : "secondary"} className="ml-2">
          {planName} Plan
        </Badge>
      </div>
    );
  }
  
  // Validate end date
  if (!endDate || isNaN(endDate.getTime())) {
    console.error('Invalid end date:', {
      current_period_end: subscription.current_period_end
    });
    return (
      <div className="flex items-center gap-2">
        <Badge variant={isActive ? "default" : "secondary"} className="ml-2">
          {planName} Plan
          <span className="ml-1">
            (Invalid date)
          </span>
        </Badge>
      </div>
    );
  }

  // Format the date
  const formattedDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // For yearly plans that are scheduled for cancellation
  if (subscription.plan_type === "student_yearly" && subscription.cancel_at_period_end) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="ml-2">
          {planName} Plan
          <span className="ml-1">
            (Access until {formattedDate})
          </span>
        </Badge>
      </div>
    );
  }

  // For active subscriptions that are not cancelled
  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="ml-2">
          {planName} Plan
          <span className="ml-1">
            {subscription.cancel_at_period_end ? 
              `(Access until ${formattedDate})` : 
              `(Renews ${formattedDate})`}
          </span>
        </Badge>
      </div>
    );
  }

  // For expired or canceled subscriptions
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="ml-2">
        {planName} Plan
        <span className="ml-1">
          (Expired {formattedDate})
        </span>
      </Badge>
    </div>
  );
};

// Add skeleton components
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header Skeleton */}
    <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-8 space-y-6">
            {/* Profile Card Skeleton */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-64" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Progress Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isNavigatingToCancel, setIsNavigatingToCancel] = useState(false);
  const [isNavigatingToPricing, setIsNavigatingToPricing] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);

  // Add debug logging for loading states
  useEffect(() => {
    console.log('Loading states:', {
      isPageLoading,
      subscriptionLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      hasProgress: !!progress,
      hasSubscription: !!subscription
    });
  }, [isPageLoading, subscriptionLoading, user, profile, progress, subscription]);

  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      if (!user) return;

      try {
        console.log('Fetching profile for user:', user.id);
        
        // First try to fetch the profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        console.log('Profile data retrieved:', profileData);
        setProfile(profileData);

        // Fetch progress
        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (progressError) {
          console.error('Progress fetch error:', progressError);
          throw new Error(`Failed to fetch progress: ${progressError.message}`);
        }

        console.log('Progress data retrieved:', progressData);
        setProgress(progressData);
      } catch (error) {
        console.error("Error in profile fetch:", error);
        setError(error instanceof Error ? error.message : "Failed to load profile data. Please try refreshing the page.");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProfile();
  }, [user, router]);

  // Update navigation handlers to include a small delay
  const handleNavigation = (path: string, setLoadingState: (value: boolean) => void) => {
    setLoadingState(true);
    // Add a small delay to show the loading state
    setTimeout(() => {
      router.push(path);
    }, 500); // 500ms delay
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          bio: profile.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      setSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return null;

    const isActive = subscription.status === "active" || subscription.status === "trialing";
    return <SubscriptionBadge subscription={subscription} isActive={isActive} />;
  };

  // Add subscription data logging
  useEffect(() => {
    if (subscription) {
      console.log('Subscription data updated:', {
        status: subscription.status,
        plan_type: subscription.plan_type,
        current_period_end: subscription.current_period_end
      });
    }
  }, [subscription]);

  // Show loading state with skeleton
  if (isPageLoading || subscriptionLoading) {
    console.log('Showing skeleton:', { isPageLoading, subscriptionLoading });
    return <ProfileSkeleton />;
  }

  // Show error state if there's an error and no profile data
  if (error && !profile) {
    console.log('Showing error:', { error, hasProfile: !!profile });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error state if profile is missing
  if (!profile) {
    console.log('Profile missing');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Profile data not found. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Clean up the main content layout
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <BackToDashboard />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="text-lg font-semibold">Profile Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              {subscription?.status === "active" && !subscription.cancel_at_period_end && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleNavigation("/profile/cancel", setIsNavigatingToCancel)}
                  className="flex items-center gap-2"
                  disabled={isNavigatingToCancel || isNavigatingToPricing || isNavigatingToHome}
                >
                  {isNavigatingToCancel ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Loading...</span>
                      <span className="sm:hidden">Loading...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel Subscription</span>
                      <span className="sm:hidden">Cancel</span>
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation("/pricing", setIsNavigatingToPricing)}
                className="flex items-center gap-2"
                disabled={isNavigatingToCancel || isNavigatingToPricing || isNavigatingToHome}
              >
                {isNavigatingToPricing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Manage Subscription</span>
                    <span className="sm:hidden">Subscription</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Profile & Progress */}
            <div className="lg:col-span-8 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">Save Changes</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">{profile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          {profile.name}
                          {getSubscriptionBadge()}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">Display Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="max-w-md"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm">About</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Progress Overview */}
              {progress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Learning Progress</CardTitle>
                      <CardDescription>Your study statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                          <p className="text-2xl font-semibold">
                            {progress.completed_questions}/{progress.total_questions}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span>MCQ Accuracy</span>
                          </div>
                          <p className="text-2xl font-semibold">{progress.mcqs_correct}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Study Time</CardTitle>
                      <CardDescription>Your learning activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Total Time</span>
                          </div>
                          <p className="text-2xl font-semibold">{progress.study_time}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>FRQs Done</span>
                          </div>
                          <p className="text-2xl font-semibold">{progress.frqs_attempted}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Right Column - Account Settings & Topics */}
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {progress?.strong_topics && progress.strong_topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Strong Topics</CardTitle>
                    <CardDescription>Areas you excel in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {progress.strong_topics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {progress?.weak_topics && progress.weak_topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Topics to Focus On</CardTitle>
                    <CardDescription>Areas for improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {progress.weak_topics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 