import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication and profile completion
 * 
 * Logic:
 * 1. If loading → show loading state
 * 2. If not authenticated → redirect to home
 * 3. If needs profile completion AND not on /complete-profile → redirect to /complete-profile
 * 4. Otherwise → render children
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  // Show loading state while auth initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 container mx-auto px-4 text-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to profile completion if needed
  // CRITICAL: Check location.pathname to prevent redirect loop
  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // All checks passed - render protected content
  return <>{children}</>;
}
