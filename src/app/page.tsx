"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, BarChart2, Code, CheckCircle, LogIn } from "lucide-react";
import TopicSelection from "@/components/practice/TopicSelection";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthModal from "@/components/auth/AuthModal";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("topics");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, login, register, logout, isLoading } = useAuth();
  const router = useRouter();

  // Generate stats based on user data or default values
  const stats = user
    ? [
        {
          name: "Completed",
          value: `${user.progress?.completedQuestions || 0}/${user.progress?.totalQuestions || 50}`,
          icon: CheckCircle,
        },
        {
          name: "MCQs Correct",
          value: user.progress?.mcqsCorrect || "0%",
          icon: BarChart2,
        },
        {
          name: "FRQs Attempted",
          value: user.progress?.frqsAttempted || "0",
          icon: Code,
        },
        {
          name: "Study Time",
          value: user.progress?.studyTime || "0 hrs",
          icon: BookOpen,
        },
      ]
    : [
        { name: "Completed", value: "0/50", icon: CheckCircle },
        { name: "MCQs Correct", value: "0%", icon: BarChart2 },
        { name: "FRQs Attempted", value: "0", icon: Code },
        { name: "Study Time", value: "0 hrs", icon: BookOpen },
      ];

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

  const handleLogout = () => {
    logout();
  };

  // Default user progress data
  const defaultProgress = {
    completedQuestions: 0,
    totalQuestions: 50,
    strongTopics: [],
    weakTopics: [],
  };

  // Use user data if available, otherwise use default
  const userProgress = user?.progress || defaultProgress;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
              AP CS Exam Prep
            </h1>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user.name}
                  </span>
                  <Button variant="outline" size="sm">
                    Profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <LogIn size={16} />
                    Login / Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
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

        {/* Main Tabs */}
        <Tabs
          defaultValue="topics"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="topics">Practice Topics</TabsTrigger>
            <TabsTrigger value="reference">Quick Reference</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Select a Topic to Practice
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  MCQ Mode
                </Button>
                <Button variant="outline" size="sm">
                  FRQ Mode
                </Button>
                <Button variant="default" size="sm">
                  Random Practice
                </Button>
              </div>
            </div>
            <TopicSelection />
          </TabsContent>

          {/* Reference Cards Tab */}
          <TabsContent value="reference" className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">
              Quick Reference Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "Arrays",
                "Loops",
                "Object-Oriented Programming",
                "Inheritance",
                "Recursion",
                "Sorting & Searching",
              ].map((topic, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle>{topic}</CardTitle>
                    <CardDescription>Key concepts and examples</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Click to view concise summaries and code examples for{" "}
                      {topic.toLowerCase()}.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {!user ? (
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
                          {userProgress.completedQuestions > 0
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
                          {userProgress.strongTopics &&
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
                          {userProgress.weakTopics &&
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
                      {userProgress.completedQuestions > 0 ? (
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

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>AP CS Exam Prep App &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
