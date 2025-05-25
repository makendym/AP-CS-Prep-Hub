"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

interface TopicStats {
  completed: number;
  total: number;
  masteryPercentage: number;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  stats?: TopicStats;
}

interface TopicSelectionProps {
  topics?: Topic[];
  onTopicSelect?: (topicId: string) => void;
}

export default function TopicSelection({
  topics = defaultTopics,
  onTopicSelect = () => {},
}: TopicSelectionProps) {
  const router = useRouter();
  const [loadingTopicId, setLoadingTopicId] = useState<string | null>(null);
  const [loadingReferenceId, setLoadingReferenceId] = useState<string | null>(
    null,
  );
  const { user } = useAuth();

  const handlePracticeClick = async (topicId: string) => {
    setLoadingTopicId(topicId);
    try {
      onTopicSelect(topicId);
      await router.push(`/practice/${topicId}`);
    } catch (error) {
      console.error("Error navigating to practice:", error);
      setLoadingTopicId(null);
    }
  };

  const handleReferenceClick = async (topicId: string) => {
    setLoadingReferenceId(topicId);
    try {
      await router.push(`/reference/${topicId}`);
    } catch (error) {
      console.error("Error navigating to reference:", error);
      setLoadingReferenceId(null);
    }
  };

  return (
    <div className="bg-background w-full py-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Practice by Topic</h2>
          <p className="text-muted-foreground">
            Select a computer science topic to practice questions related to
            that area.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-md">
                    {topic.icon}
                  </div>
                  {user && topic.stats && (
                    <Badge
                      variant={
                        topic.stats.masteryPercentage > 70
                          ? "default"
                          : "outline"
                      }
                    >
                      {topic.stats.masteryPercentage}% Mastery
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{topic.name}</CardTitle>
                <CardDescription>{topic.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {topic.stats ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {topic.stats.completed}/{topic.stats.total} Questions
                      </span>
                    </div>
                    <Progress
                      value={(topic.stats.completed / topic.stats.total) * 100}
                    />
                  </div>
                ) : (
                  <div className="h-8 flex items-center text-sm text-muted-foreground">
                    No practice history yet
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePracticeClick(topic.id);
                  }}
                  disabled={loadingTopicId === topic.id}
                >
                  {loadingTopicId === topic.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start Practice"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReferenceClick(topic.id);
                  }}
                  disabled={loadingReferenceId === topic.id}
                >
                  {loadingReferenceId === topic.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Default topics with mock data
const defaultTopics: Topic[] = [
  {
    id: "arrays",
    name: "Arrays & ArrayLists",
    description:
      "Working with collections of data, including 1D and 2D arrays, and ArrayList objects.",
    icon: <Code className="h-6 w-6 text-primary" />,
    stats: {
      completed: 12,
      total: 20,
      masteryPercentage: 75,
    },
  },
  {
    id: "loops",
    name: "Loops & Control Flow",
    description:
      "For loops, while loops, nested loops, and conditional statements.",
    icon: <Code className="h-6 w-6 text-primary" />,
    stats: {
      completed: 8,
      total: 15,
      masteryPercentage: 60,
    },
  },
  {
    id: "oop",
    name: "Object-Oriented Programming",
    description:
      "Classes, objects, inheritance, polymorphism, and encapsulation.",
    icon: <Code className="h-6 w-6 text-primary" />,
    stats: {
      completed: 5,
      total: 18,
      masteryPercentage: 40,
    },
  },
  {
    id: "recursion",
    name: "Recursion",
    description:
      "Recursive methods, recursive problem solving, and recursive data structures.",
    icon: <Code className="h-6 w-6 text-primary" />,
    stats: {
      completed: 3,
      total: 10,
      masteryPercentage: 30,
    },
  },
  {
    id: "algorithms",
    name: "Searching & Sorting",
    description:
      "Binary search, selection sort, insertion sort, and merge sort algorithms.",
    icon: <Code className="h-6 w-6 text-primary" />,
    stats: {
      completed: 7,
      total: 12,
      masteryPercentage: 58,
    },
  },
  {
    id: "inheritance",
    name: "Inheritance & Interfaces",
    description:
      "Class hierarchies, method overriding, abstract classes, and interfaces.",
    icon: <Code className="h-6 w-6 text-primary" />,
  },
];
