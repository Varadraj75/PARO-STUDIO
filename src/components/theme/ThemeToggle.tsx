import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  // Use resolvedTheme for accurate current theme state
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-gold" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </Button>
  );
}
