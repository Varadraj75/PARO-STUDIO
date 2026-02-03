import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border py-4 sm:py-6 mt-6 sm:mt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <Link to="/" className="font-serif text-base sm:text-lg tracking-tight hover:text-gold transition-colors">
            PARO
          </Link>
          <p className="text-xs text-muted-foreground">
            Discover and share AI prompts
          </p>
        </div>
      </div>
    </footer>
  );
}