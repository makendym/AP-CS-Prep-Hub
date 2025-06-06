"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import LoadingPage from "./LoadingPage";
import { useRouter } from "next/navigation";
import SessionTimeoutModal from "./SessionTimeoutModal";

// Timeout duration in milliseconds (e.g., 1 minute)
const SESSION_TIMEOUT = 30 * 1000; // 30 seconds
const WARNING_DURATION = 15; // 15 seconds warning
const ACTIVITY_THROTTLE = 1000; // Throttle activity checks to once per second

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGoogleLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetSessionTimer: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isGoogleLoading: false,
  error: null,
  login: async () => false,
  register: async () => false,
  loginWithGoogle: async () => false,
  logout: async () => {},
  resetSessionTimer: () => {},
  isLoading: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isWarningShown, setIsWarningShown] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [lastActivityCheck, setLastActivityCheck] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  const resetSessionTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsWarningShown(false);
  }, []);

  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityCheck >= ACTIVITY_THROTTLE && !isWarningShown && user) {
      setLastActivityCheck(now);
      resetSessionTimer();
    }
  }, [lastActivityCheck, isWarningShown, resetSessionTimer, user]);

  const handleLogout = useCallback(async () => {
    try {
      setIsWarningShown(false);
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        if (error.message === "Email not confirmed") {
          await new Promise(resolve => setTimeout(resolve, 1500));
          setError("Please verify your email address before logging in. Check your inbox for the confirmation link.");
          return false;
        }
        setError(error.message);
        return false;
      }

      if (!data.session) {
        setError("Please confirm your email before logging in.");
        return false;
      }

      if (data.user) {
        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          setError("Error loading profile data. Please try again.");
          return false;
        }

        setUser(data.user);
        resetSessionTimer();
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            provider: null,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return false;
      }

      if (data.user) {
        setError("Please check your email for a confirmation link. You'll need to verify your email before you can log in.");
        return false;
      }
      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during registration";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setTimeout(() => {
          setIsGoogleLoading(false);
        }, 1000);
        setError(error.message);
        return false;
      }

      // Add a delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    } catch (error: unknown) {
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 1000);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during Google sign-in";
      setError(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    const checkSessionTimeout = () => {
      if (!user) return; // Don't check timeout if user is not logged in
      
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= SESSION_TIMEOUT - WARNING_DURATION && !isWarningShown) {
        setIsWarningShown(true);
      }
    };

    const interval = setInterval(checkSessionTimeout, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, isWarningShown, user]);

  useEffect(() => {
    if (!user) return; // Don't track activity if user is not logged in

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    const throttledHandler = (event: Event) => {
      handleUserActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [handleUserActivity, user]);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (session) {
          setUser(session.user);
          resetSessionTimer();
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        resetSessionTimer();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resetSessionTimer]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGoogleLoading: loading,
        error,
        login,
        register,
        loginWithGoogle,
        logout: handleLogout,
        resetSessionTimer,
        isLoading: loading,
      }}
    >
      {children}
      {isGoogleLoading && <LoadingPage />}
      {user && (
        <SessionTimeoutModal
          isOpen={isWarningShown}
          onClose={handleLogout}
          onContinue={resetSessionTimer}
          countdownDuration={WARNING_DURATION}
        />
      )}
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
