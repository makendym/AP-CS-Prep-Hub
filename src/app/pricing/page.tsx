"use client";

import { useState } from "react";
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
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthModal from "@/components/auth/AuthModal";

export default function PricingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, login, register } = useAuth();
  const router = useRouter();

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

  const handleStartFreeTrial = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      // If user is already logged in, redirect to dashboard
      router.push("/");
    }
  };

  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      duration: "14 days",
      description: "Try all features free for 14 days",
      features: [
        "Access to all practice questions",
        "Basic progress tracking",
        "Limited MCQs and FRQs",
        "Quick reference cards",
      ],
      buttonText: "Start Free Trial",
      highlighted: false,
    },
    {
      name: "Student",
      price: "$9.99",
      duration: "monthly",
      description: "Perfect for individual exam preparation",
      features: [
        "Unlimited practice questions",
        "Detailed progress analytics",
        "Personalized study plans",
        "Full access to all MCQs and FRQs",
        "Advanced code evaluation",
        "Comprehensive reference materials",
      ],
      buttonText: "Subscribe Now",
      highlighted: true,
    },
    {
      name: "Classroom",
      price: "$99.99",
      duration: "monthly",
      description: "Ideal for teachers and classrooms",
      features: [
        "Everything in Student plan",
        "Up to 30 student accounts",
        "Teacher dashboard",
        "Class progress reports",
        "Assignment creation tools",
        "Priority support",
      ],
      buttonText: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
              AP CS Exam Prep
            </h1>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the edge you need to ace the AP Computer Science A exam with our
            comprehensive practice platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col ${plan.highlighted ? "border-primary shadow-lg" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">
                    /{plan.duration}
                  </span>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={handleStartFreeTrial}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center bg-muted p-8 rounded-lg max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            100% Satisfaction Guarantee
          </h2>
          <p className="text-muted-foreground mb-6">
            Not satisfied with your subscription? Contact us within 30 days of
            purchase for a full refund.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline">View FAQs</Button>
            <Button variant="outline">Contact Support</Button>
          </div>
        </div>
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
        onGoogleLogin={loginWithGoogle}
      />
    </div>
  );
}
