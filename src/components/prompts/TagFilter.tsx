import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll?: () => void;
}

export function TagFilter({ tags, selectedTags, onTagToggle, onClearAll }: TagFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if scrolling is needed and update arrow visibility
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [tags]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background/90 backdrop-blur-sm rounded-full shadow-sm border border-border hover:bg-secondary transition-colors hidden sm:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5 sm:px-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {selectedTags.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="flex-shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        )}
        
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={cn(
                "flex-shrink-0 px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm rounded-sm transition-all duration-300 whitespace-nowrap touch-target",
                isSelected
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background/90 backdrop-blur-sm rounded-full shadow-sm border border-border hover:bg-secondary transition-colors hidden sm:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Gradient fade indicators */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none sm:hidden" />
      )}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
      )}
    </div>
  );
}