"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Play, BookOpen, Code, Shuffle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToDashboard } from "@/components/ui/back-to-dashboard";

type QuestionType = "mcq" | "frq" | "mixed";
type DifficultyLevel = "easy" | "medium" | "hard" | "all";

interface PracticeConfig {
  type: QuestionType;
  difficulty: DifficultyLevel;
  mode?: "random";
}

export default function SelectOptionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const source = searchParams.get("source") as "official" | "ai-generated" || "official";
  const [isLoading, setIsLoading] = useState(true);

  const [config, setConfig] = useState<PracticeConfig>({
    type: "mixed",
    difficulty: "all",
  });

  // Topic names mapping
  const topicNames: { [key: string]: string } = {
    arrays: "Arrays & ArrayLists",
    loops: "Loops & Control Flow",
    oop: "Object-Oriented Programming",
    recursion: "Recursion",
    algorithms: "Searching & Sorting",
    inheritance: "Inheritance & Interfaces",
  };

  const topicName = topicNames[topicId] || topicId;

  // Mock progress data - in real app this would come from user's actual progress
  const topicProgress = {
    completed: Math.floor(Math.random() * 15) + 5,
    total: 20,
    masteryPercentage: Math.floor(Math.random() * 40) + 40,
  };

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartPractice = () => {
    const searchParams = new URLSearchParams();
    searchParams.set("source", source);
    searchParams.set("type", config.type);
    searchParams.set("difficulty", config.difficulty);
    if (config.mode) {
      searchParams.set("mode", config.mode);
    }

    router.push(`/practice/${topicId}?${searchParams.toString()}`);
  };

  const getEstimatedQuestions = () => {
    // Mock estimation based on filters
    let base = 10;
    if (config.type === "mcq") base = 15;
    if (config.type === "frq") base = 8;
    if (config.difficulty !== "all") base = Math.floor(base * 0.7);
    return base;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-32 mb-4" />
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-32" />
              </div>
            </div>

            {/* Progress Card Skeleton */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Configuration Options Skeleton */}
          <div className="space-y-6">
            {/* Question Type Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Level Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Practice Mode Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Start Practice Section Skeleton */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <BackToDashboard />

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Configure Your Practice</h1>
                <p className="text-muted-foreground">
                  Customize your {topicName.toLowerCase()} practice session
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {source === "ai-generated" ? "AI Practice Questions" : "Official AP Questions"}
              </Badge>
            </div>
          </div>

          {/* Progress Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{topicName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {topicProgress.completed}/{topicProgress.total} questions
                    completed
                  </p>
                </div>
                <Badge
                  variant={
                    topicProgress.masteryPercentage > 70 ? "default" : "outline"
                  }
                >
                  {topicProgress.masteryPercentage}% Mastery
                </Badge>
              </div>
              <Progress
                value={(topicProgress.completed / topicProgress.total) * 100}
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Configuration Options */}
        <div className="space-y-6">
          {/* Question Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Question Type
              </CardTitle>
              <CardDescription>
                Select the type of questions you want to practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={config.type === "mixed" ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, type: "mixed" }))
                  }
                >
                  <div className="font-medium mb-1">Mixed Practice</div>
                  <div className="text-sm text-muted-foreground text-center">
                    Both MCQ and FRQ questions
                  </div>
                </Button>
                <Button
                  variant={config.type === "mcq" ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, type: "mcq" }))
                  }
                >
                  <div className="font-medium mb-1">MCQ Only</div>
                  <div className="text-sm text-muted-foreground text-center">
                    Multiple choice questions
                  </div>
                </Button>
                <Button
                  variant={config.type === "frq" ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, type: "frq" }))
                  }
                >
                  <div className="font-medium mb-1">FRQ Only</div>
                  <div className="text-sm text-muted-foreground text-center">
                    Free response questions
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Level */}
          <Card>
            <CardHeader>
              <CardTitle>Difficulty Level</CardTitle>
              <CardDescription>
                Choose the difficulty that matches your current skill level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    value: "all",
                    label: "All Levels",
                    desc: "Mixed difficulty",
                  },
                  { value: "easy", label: "Easy", desc: "Basic concepts" },
                  { value: "medium", label: "Medium", desc: "Intermediate" },
                  { value: "hard", label: "Hard", desc: "Advanced topics" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      config.difficulty === option.value ? "default" : "outline"
                    }
                    className="h-auto p-4 flex flex-col items-center"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        difficulty: option.value as DifficultyLevel,
                      }))
                    }
                  >
                    <div className="font-medium mb-1">{option.label}</div>
                    <div className="text-sm text-muted-foreground text-center">
                      {option.desc}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Practice Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Practice Mode
              </CardTitle>
              <CardDescription>
                Choose how questions are presented to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant={!config.mode ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, mode: undefined }))
                  }
                >
                  <div className="font-medium mb-1">Sequential</div>
                  <div className="text-sm text-muted-foreground text-left">
                    Questions in order of difficulty
                  </div>
                </Button>
                <Button
                  variant={config.mode === "random" ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, mode: "random" }))
                  }
                >
                  <div className="font-medium mb-1">Random</div>
                  <div className="text-sm text-muted-foreground text-left">
                    Questions in random order
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Practice Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Ready to Start?</h3>
                <p className="text-sm text-muted-foreground">
                  Estimated {getEstimatedQuestions()} questions based on your
                  selections
                </p>
              </div>
              <Button
                onClick={handleStartPractice}
                size="lg"
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
