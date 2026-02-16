import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute wrapper component
 * 
 * Redirects to /complete-profile if user is authenticated but has no username.
 * This ensures users cannot access the app until they've set a username.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  // Don't redirect while loading
  if (loading) {
    return <>{children}</>;
  }

  // If user needs to complete profile and not already on that page, redirect
  if (needsProfileCompletion && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
