
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { mockService, UserProfile } from "@/lib/mockData";
import * as supabaseAuth from "@/services/supabase/auth";
import { getProfile } from "@/services/supabase/profiles";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

// User type compatible with both Supabase and mock
interface User {
  id: string;
  email?: string;
}

/**
 * Auth Context
 * 
 * - user: Derived from session.user (synchronous after init)
 * - session: Supabase session (synchronous after init)
 * - profile: User profile data (ASYNC, can be null even when authenticated)
 * - loading: True during auth initialization and state changes
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      // Try Supabase profile first
      const supabaseProfile = await getProfile(userId);
      if (supabaseProfile) {
        // Convert Supabase profile to UserProfile format
        return {
          id: supabaseProfile.id,
          username: supabaseProfile.username,
          display_name: supabaseProfile.full_name || supabaseProfile.username || null,
          avatar_url: supabaseProfile.avatar_url,
          cover_url: supabaseProfile.cover_url,
          bio: supabaseProfile.bio,
          website: supabaseProfile.website,
          twitter: null,
          instagram: null,
        };
      }

      // If Supabase profile doesn't exist, return null
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get current session from Supabase
        const currentSession = await supabaseAuth.getSession();
        
        if (!currentSession) {
          // 🔥 CRITICAL: Clear stale auth state when getSession() returns null
          // This prevents stale refresh token loops that break logout
          await supabaseAuth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
        } else {
          const userObj: User = {
            id: currentSession.user.id,
            email: currentSession.user.email,
          };
          
          setUser(userObj);
          setSession(currentSession);
          
          // On page load, ensure profile exists (safe now with fixed RLS logic)
          // This handles the case where user refreshes and has a session but no profile
          const { profile: profileData } = await supabaseAuth.ensureProfile(currentSession.user);
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const subscription = supabaseAuth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      try {
        // Set loading during auth state changes to prevent flashing
        setLoading(true);
        
        if (session?.user) {
          const userObj: User = {
            id: session.user.id,
            email: session.user.email,
          };
          
          setUser(userObj);
          setSession(session);
          
          // Ensure profile exists only on SIGNED_IN (new login)
          // INITIAL_SESSION is already handled in initAuth()
          if (event === 'SIGNED_IN') {
            await supabaseAuth.ensureProfile(session.user);
          }
          
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } finally {
        // Clear loading after auth state is fully updated
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabaseAuth.signInWithGoogle();
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // OAuth redirect will happen, session will be set by onAuthStateChange
      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Sign in failed",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    // For now, redirect to Google OAuth
    toast({
      title: "Please use Google Sign In",
      description: "Email/password signup coming soon!",
    });
    return { error: new Error("Not implemented") };
  };

  const signIn = async (email: string, password: string) => {
    // For now, redirect to Google OAuth
    toast({
      title: "Please use Google Sign In",
      description: "Email/password login coming soon!",
    });
    return { error: new Error("Not implemented") };
  };

  const signOut = async () => {
    // Always clear local state, even if Supabase signOut fails
    // This prevents the UI from getting stuck in a logged-in state
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.error("Error signing out from Supabase:", error);
      // Continue anyway - we still want to clear local state
    }
    
    // Clear state regardless of API result
    setUser(null);
    setSession(null);
    setProfile(null);
    
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
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
