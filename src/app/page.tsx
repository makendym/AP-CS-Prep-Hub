"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  BarChart2,
  Code,
  CheckCircle,
  LogIn,
  Loader2,
} from "lucide-react";
import TopicSelection from "@/components/practice/TopicSelection";
import { useAuth } from "@/components/auth/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import { User } from "@supabase/supabase-js";

interface UserProgress {
  completedQuestions?: number;
  totalQuestions?: number;
  mcqsCorrect?: string;
  frqsAttempted?: string;
  studyTime?: string;
  strongTopics?: string[];
  weakTopics?: string[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("topics");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const {
    user: supabaseUser,
    login,
    loginWithGoogle,
    register,
    logout,
    isLoading: isAuthLoading,
  } = useAuth();
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isNavigatingToPricing, setIsNavigatingToPricing] = useState(false);
  const [isNavigatingToProfile, setIsNavigatingToProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (supabaseUser) {
      // In a real app, you would fetch progress from your DB here
      // For now, let's simulate fetching or use mock data
      const mockProgress: UserProgress = {
        completedQuestions: Math.floor(Math.random() * 20),
        totalQuestions: 50,
        mcqsCorrect: `${Math.floor(Math.random() * 100)}%`,
        frqsAttempted: String(Math.floor(Math.random() * 10)),
        studyTime: `${Math.floor(Math.random() * 10)} hrs`,
        strongTopics: getRandomTopics(),
        weakTopics: getRandomTopics(),
      };
      setUserProgress(mockProgress);
    } else {
      setUserProgress(null);
    }
  }, [supabaseUser]);

  const getRandomTopics = () => {
    const allTopics = [
      "Arrays",
      "Loops",
      "Object-Oriented Programming",
      "Inheritance",
      "Recursion",
      "Sorting & Searching",
    ];
    return allTopics
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);
  };

  useEffect(() => {
    // Simulate initial page load
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (value: string) => {
    setIsTransitioning(true);
    setActiveTab(value);
    // Simulate loading time for tab content
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  // Generate stats based on user data or default values
  const stats = userProgress
    ? [
        {
          name: "Completed",
          value: `${userProgress.completedQuestions || 0}/${userProgress.totalQuestions || 50}`,
          icon: CheckCircle,
        },
        {
          name: "MCQs Correct",
          value: userProgress.mcqsCorrect || "0%",
          icon: BarChart2,
        },
        {
          name: "FRQs Attempted",
          value: userProgress.frqsAttempted || "0",
          icon: Code,
        },
        {
          name: "Study Time",
          value: userProgress.studyTime || "0 hrs",
          icon: BookOpen,
        },
      ]
    : [
        { name: "Completed", value: "0/50", icon: CheckCircle },
        { name: "MCQs Correct", value: "0%", icon: BarChart2 },
        { name: "FRQs Attempted", value: "0", icon: Code },
        { name: "Study Time", value: "0 hrs", icon: BookOpen },
      ];

  // Default user progress data (still needed for type consistency if userProgress is null)
  const defaultProgress: UserProgress = {
    // Added type annotation
    completedQuestions: 0,
    totalQuestions: 50,
    strongTopics: [],
    weakTopics: [],
  };

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
  ) => {
    await register(email, password, name);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      await logout();
      setIsLoggingOut(false);
    }, 500);
  };

  // Add navigation handler with delay
  const handleNavigation = (
    path: string,
    setLoadingState: (value: boolean) => void,
  ) => {
    setLoadingState(true);
    setTimeout(() => {
      router.push(path);
    }, 500);
  };

  if (isPageLoading || isAuthLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Left side - Branding Skeleton */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="hidden sm:block h-6 w-px bg-border mx-2" />
                <div className="hidden sm:flex items-center gap-4">
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>

              {/* Right side - Auth Skeleton */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4).fill(0).map((_, index) => (
              <Card key={index} className="bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="w-full max-w-md mx-auto mb-8">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-8">
            {/* Topics Tab Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <Card key={index} className="bg-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>

        {/* Footer Skeleton */}
        <footer className="border-t bg-card">
          <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left side - Enhanced Branding */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  AP CompTutor
                </h1>
                <p className="text-xs text-muted-foreground -mt-1 hidden sm:block">
                  Master AP Computer Science A
                </p>
              </div>
              <div className="hidden sm:block h-6 w-px bg-border mx-2" />
              <nav className="hidden sm:flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleNavigation("/pricing", setIsNavigatingToPricing)
                  }
                  className="text-muted-foreground hover:text-foreground"
                  disabled={
                    isNavigatingToPricing ||
                    isNavigatingToProfile ||
                    isLoggingOut
                  }
                >
                  {isNavigatingToPricing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    "Pricing"
                  )}
                </Button>
              </nav>
            </div>

            {/* Right side - Auth */}
            <div className="flex items-center gap-3">
              {supabaseUser ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleNavigation("/profile", setIsNavigatingToProfile)
                    }
                    className="text-muted-foreground hover:text-foreground"
                    disabled={
                      isNavigatingToPricing ||
                      isNavigatingToProfile ||
                      isLoggingOut
                    }
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
                  <div className="hidden sm:block h-6 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-sm text-muted-foreground">
                      {supabaseUser.user_metadata?.full_name ||
                        supabaseUser.user_metadata?.name ||
                        supabaseUser.email?.split("@")[0]}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={
                        isNavigatingToPricing ||
                        isNavigatingToProfile ||
                        isLoggingOut
                      }
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        "Logout"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2"
                  disabled={
                    isNavigatingToPricing ||
                    isNavigatingToProfile ||
                    isLoggingOut
                  }
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary opacity-80" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs
          defaultValue="topics"
          className="w-full"
          onValueChange={handleTabChange}
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="topics">Practice Topics</TabsTrigger>
            <TabsTrigger value="reference">Quick Reference</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="space-y-8">
            {isPageLoading || isTransitioning ? (
              <div className="space-y-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <Skeleton className="h-8 w-64 mb-2" />
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>

                {/* Topics Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <Skeleton className="h-6 w-48 mt-4" />
                        <Skeleton className="h-4 w-64 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <TopicSelection
                onTopicSelect={(topicId) => {
                  router.push(`/practice/${topicId}`);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="reference" className="space-y-4">
            {isPageLoading || isTransitioning ? (
              <>
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <Card key={index} className="bg-card">
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Quick Reference Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Arrays", id: "arrays" },
                    { name: "Loops", id: "loops" },
                    { name: "Object-Oriented Programming", id: "oop" },
                    { name: "Inheritance", id: "inheritance" },
                    { name: "Recursion", id: "recursion" },
                    { name: "Sorting & Searching", id: "algorithms" },
                  ].map((topic, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/reference/${topic.id}`)}
                    >
                      <CardHeader>
                        <CardTitle>{topic.name}</CardTitle>
                        <CardDescription>
                          Key concepts and examples
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Click to view concise summaries and code examples for{" "}
                          {topic.name.toLowerCase()}.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {isPageLoading || isTransitioning || isAuthLoading ? (
              <>
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <Card
                        key={index}
                        className={index === 2 ? "lg:col-span-2" : ""}
                      >
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            ) : !supabaseUser ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-medium mb-4">
                    Login to Track Your Progress
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create an account or login to save your practice results and
                    track your progress over time.
                  </p>
                  <Button onClick={() => setIsAuthModalOpen(true)}>
                    Login / Register
                  </Button>
                </CardContent>
              </Card>
            ) : userProgress === null ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading progress data...</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Your Progress</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                      <CardDescription>
                        Your progress across all topics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center border rounded-md">
                        <p className="text-muted-foreground">
                          {(userProgress?.completedQuestions || 0) > 0
                            ? "Performance chart will appear here"
                            : "Complete some practice questions to see your performance chart"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Strengths & Weaknesses</CardTitle>
                      <CardDescription>Topics to focus on</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Strong Topics</h3>
                          {userProgress?.strongTopics &&
                          userProgress.strongTopics.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {userProgress.strongTopics.map((topic, i) => (
                                <div
                                  key={i}
                                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1 rounded-full text-sm"
                                >
                                  {topic}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Complete more practice to identify your strengths
                            </p>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">
                            Needs Improvement
                          </h3>
                          {userProgress?.weakTopics &&
                          userProgress.weakTopics.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {userProgress.weakTopics.map((topic, i) => (
                                <div
                                  key={i}
                                  className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 px-3 py-1 rounded-full text-sm"
                                >
                                  {topic}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Complete more practice to identify areas for
                              improvement
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Your latest practice sessions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(userProgress?.completedQuestions || 0) > 0 ? (
                        <div className="border rounded-md divide-y">
                          {[1, 2, 3].map((_, i) => (
                            <div
                              key={i}
                              className="p-4 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">
                                  FRQ Practice:{" "}
                                  {["Arrays", "Inheritance", "Loops"][i]}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {["Yesterday", "2 days ago", "1 week ago"][i]}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {["8/10", "6/10", "9/10"][i]} points
                                </p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                >
                                  Review
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No practice sessions yet</p>
                          <Button
                            variant="link"
                            onClick={() => setActiveTab("topics")}
                          >
                            Start practicing now
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>AP CS Exam Prep App &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={loginWithGoogle}
      />
    </div>
  );
}
