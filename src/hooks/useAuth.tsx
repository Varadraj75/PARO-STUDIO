
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { mockService, UserProfile } from "@/lib/mockData";

// Simplified User and Session types for the mock
interface User {
  id: string;
  email?: string;
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
      const data = await mockService.getProfile(userId);
      return data;
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
    // Check local storage for persisted session
    const storedUser = localStorage.getItem("prompt-muse-user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Re-establish session
        const mockSession = { user: parsedUser, access_token: "mock-token" };
        setUser(parsedUser);
        setSession(mockSession);
        fetchProfile(parsedUser.id).then(setProfile);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("prompt-muse-user");
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    // Mock sign up - just automatically sign them in as the demo user for now
    // In a real mock, we might create a new entry in mockService

    // For this specific 'alive' demo, let's treat signup as success but warn it's a demo
    toast({
      title: "Account created (Demo)",
      description: "Welcome! This is a demo mode.",
    });

    // Auto-login as the demo user
    return signIn(email, password);
  };

  const signIn = async (email: string, password: string) => {
    const { user: mockUser, error } = await mockService.signIn(email);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    if (mockUser) {
      const userObj = { id: mockUser.id, email };
      const sessionObj = { user: userObj, access_token: "mock-token" };

      setUser(userObj);
      setSession(sessionObj);
      setProfile(mockUser);

      localStorage.setItem("prompt-muse-user", JSON.stringify(userObj));

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      return { error: null };
    }

    return { error: new Error("User not found") };
  };

  const signOut = async () => {
    await mockService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem("prompt-muse-user");
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
