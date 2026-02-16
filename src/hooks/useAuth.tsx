import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import * as supabaseAuth from '@/services/supabase/auth';
import { getProfile } from '@/services/supabase/profiles';
import { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
 * - needsProfileCompletion: True if user is authenticated but has no username
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  needsProfileCompletion: boolean;
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
    console.log('🔍 fetchProfile: Starting for userId:', userId);
    try {
      // First, ensure profile exists in database (creates if doesn't exist)
      const currentUser = await supabaseAuth.getCurrentUser();
      console.log('🔍 fetchProfile: getCurrentUser result:', currentUser ? 'User found' : 'No user');
      
      if (currentUser) {
        console.log('🔍 fetchProfile: Calling ensureProfile for user:', currentUser.id);
        const { profile: supabaseProfile, error } = await supabaseAuth.ensureProfile(currentUser);
        
        console.log('🔍 fetchProfile: ensureProfile returned:', {
          hasProfile: !!supabaseProfile,
          hasError: !!error,
          error: error,
          profileData: supabaseProfile
        });

        if (error) {
          console.error("❌ fetchProfile: Error ensuring profile:", error);
          return null;
        }

        if (supabaseProfile) {
          console.log('✅ fetchProfile: Converting Supabase profile to UserProfile format');
          // Convert Supabase profile to UserProfile format
          const userProfile = {
            id: supabaseProfile.id,
            username: supabaseProfile.username,
            display_name: supabaseProfile.full_name || supabaseProfile.username || null,
            avatar_url: supabaseProfile.avatar_url,
            cover_url: supabaseProfile.cover_url,
            bio: supabaseProfile.bio,
          };
          console.log('✅ fetchProfile: Returning profile:', userProfile);
          return userProfile;
        }
      }

      // Fallback: try to fetch existing profile directly
      console.log('⚠️ fetchProfile: Fallback - trying getProfile directly');
      const supabaseProfile = await getProfile(userId);
      if (supabaseProfile) {
        console.log('✅ fetchProfile: Found profile via direct fetch');
        return {
          id: supabaseProfile.id,
          username: supabaseProfile.username,
          display_name: supabaseProfile.full_name || supabaseProfile.username || null,
          avatar_url: supabaseProfile.avatar_url,
          cover_url: supabaseProfile.cover_url,
          bio: supabaseProfile.bio,
        };
      }

      console.error('❌ fetchProfile: No profile found - returning null');
      return null;
    } catch (error) {
      console.error("❌ fetchProfile: Exception caught:", error);
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
    console.log('🚀 useAuth: Setting up auth subscription');

    // Subscribe to auth changes - this handles ALL auth state including initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, session ? `Session for ${session.user.email}` : 'No session');
      
      try {
        if (event === 'INITIAL_SESSION') {
          // Page load/refresh - restore session if exists
          console.log('🔔 INITIAL_SESSION: Restoring session');
          if (session?.user) {
            const userObj: User = {
              id: session.user.id,
              email: session.user.email,
            };
            
            console.log('🔔 INITIAL_SESSION: User found:', userObj.id);
            setUser(userObj);
            setSession(session);
            
            // Fetch/create profile
            console.log('🔔 INITIAL_SESSION: Fetching profile');
            const profileData = await fetchProfile(session.user.id);
            console.log('🔔 INITIAL_SESSION: Profile result:', profileData ? 'Found' : 'Not found');
            setProfile(profileData);
          } else {
            console.log('🔔 INITIAL_SESSION: No session, user is signed out');
            setUser(null);
            setSession(null);
            setProfile(null);
          }
          // Clear loading after initial session is processed
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          // New login
          console.log('🔔 SIGNED_IN: New authentication');
          if (session?.user) {
            const userObj: User = {
              id: session.user.id,
              email: session.user.email,
            };
            
            console.log('🔔 SIGNED_IN: User authenticated:', userObj.id);
            setUser(userObj);
            setSession(session);
            
            // Fetch/create profile
            console.log('🔔 SIGNED_IN: Fetching profile');
            const profileData = await fetchProfile(session.user.id);
            console.log('🔔 SIGNED_IN: Profile result:', profileData ? 'Found' : 'Not found');
            setProfile(profileData);
          }
        } else if (event === 'SIGNED_OUT') {
          // Logout
          console.log('🔔 SIGNED_OUT: Clearing auth state');
          setUser(null);
          setSession(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh - update session but keep user/profile
          console.log('🔔 TOKEN_REFRESHED: Updating session');
          if (session) {
            setSession(session);
          }
        } else if (event === 'USER_UPDATED') {
          // User metadata updated
          console.log('🔔 USER_UPDATED: Refreshing profile');
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('❌ Auth event handler error:', error);
      }
    });

    return () => {
      console.log('🚀 useAuth: Cleaning up auth subscription');
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
        needsProfileCompletion: !!user && (!profile || !profile.username),
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
