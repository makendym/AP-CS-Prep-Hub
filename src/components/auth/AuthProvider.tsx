"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
// Using Supabase client directly instead of auth-helpers-nextjs
import { createClient } from "@supabase/supabase-js";

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  progress?: {
    completedQuestions?: number;
    totalQuestions?: number;
    mcqsCorrect?: string;
    frqsAttempted?: string;
    studyTime?: string;
    strongTopics?: string[];
    weakTopics?: string[];
  };
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  fetchUsers: () => Promise<User[]>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Add mock progress data if not present
        if (!parsedUser.progress) {
          parsedUser.progress = {
            completedQuestions: Math.floor(Math.random() * 20),
            totalQuestions: 50,
            mcqsCorrect: `${Math.floor(Math.random() * 100)}%`,
            frqsAttempted: String(Math.floor(Math.random() * 10)),
            studyTime: `${Math.floor(Math.random() * 10)} hrs`,
            strongTopics: getRandomTopics(),
            weakTopics: getRandomTopics(),
          };
        }
        setUser(parsedUser);
        // Set a cookie for middleware authentication
        document.cookie = `user=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      } catch (e) {
        localStorage.removeItem("user");
        document.cookie = "user=; path=/; max-age=0"; // Clear cookie
      }
    }
    setIsLoading(false);
  }, []);

  // Helper function to get random topics
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

  // Mock login function - in a real app, this would call an API
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const mockUser: User = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || email.split("@")[0],
          email: data.user.email || email,
          emailVerified: data.user.email_confirmed_at !== null,
          createdAt: data.user.created_at || new Date().toISOString(),
          updatedAt: data.user.updated_at || new Date().toISOString(),
          progress: {
            completedQuestions: Math.floor(Math.random() * 20),
            totalQuestions: 50,
            mcqsCorrect: `${Math.floor(Math.random() * 100)}%`,
            frqsAttempted: String(Math.floor(Math.random() * 10)),
            studyTime: `${Math.floor(Math.random() * 10)} hrs`,
            strongTopics: getRandomTopics(),
            weakTopics: getRandomTopics(),
          },
        };

        setUser(mockUser);
        localStorage.setItem("user", JSON.stringify(mockUser));
        document.cookie = `user=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      }
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock register function
  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            email_verified: false,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          name: data.user.user_metadata?.name || name,
          email: data.user.email || email,
          emailVerified: false,
          createdAt: data.user.created_at || new Date().toISOString(),
          updatedAt: data.user.updated_at || new Date().toISOString(),
          progress: {
            completedQuestions: 0,
            totalQuestions: 50,
            mcqsCorrect: '0%',
            frqsAttempted: '0',
            studyTime: '0 hrs',
            strongTopics: [],
            weakTopics: [],
          }
        };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
      }
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Clear the cookie
    document.cookie = "user=; path=/; max-age=0";
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error logging in with Google:', error);
      setIsLoading(false);
    }
  };

  const fetchUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      return data.users.map(u => ({
        id: u.id,
        name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        email: u.email || '',
        emailVerified: u.email_confirmed_at !== null,
        createdAt: u.created_at || new Date().toISOString(),
        updatedAt: u.updated_at || new Date().toISOString(),
        progress: {
          completedQuestions: Math.floor(Math.random() * 20),
          totalQuestions: 50,
          mcqsCorrect: `${Math.floor(Math.random() * 100)}%`,
          frqsAttempted: String(Math.floor(Math.random() * 10)),
          studyTime: `${Math.floor(Math.random() * 10)} hrs`,
          strongTopics: getRandomTopics(),
          weakTopics: getRandomTopics(),
        }
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, loginWithGoogle, fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
