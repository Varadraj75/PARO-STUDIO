import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-background px-4 sm:px-6">
      <div className="text-center max-w-md">
        <h1 className="mb-3 sm:mb-4 text-5xl sm:text-6xl md:text-7xl font-serif text-gold">404</h1>
        <p className="mb-4 sm:mb-6 text-lg sm:text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-full text-sm sm:text-base font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;