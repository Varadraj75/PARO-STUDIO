import { useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { STANDARD_TAGS } from "@/lib/standardTags";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FeedCard } from "@/components/feed";
import { TagFilter } from "@/components/prompts/TagFilter";
import { usePrompts } from "@/hooks/usePrompts";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedItem, toImageFeedItem, injectAdvertisements } from "@/lib/feedTypes";
import { AuthModal } from "@/components/auth/AuthModal";

import { getCdnUrl } from "@/config/cdn";
import { GALLERY_MANIFEST } from "@/config/galleryManifest";

// Convert gallery manifest to prompt format
// Images are loaded from CDN: https://cdn.jsdelivr.net/gh/varadraj75/paro-assets/images/hero/
const MOCK_PROMPTS = GALLERY_MANIFEST.map((item, index) => ({
  id: item.id,
  title: item.title,
  prompt_text: item.prompt_text,
  image_url: getCdnUrl("HERO", item.filename), // Using HERO folder from CDN
  tool_used: item.tool_used,
  view_count: Math.floor(Math.random() * 20000) + 5000,
  copy_count: Math.floor(Math.random() * 5000) + 1000,
  created_at: new Date(Date.now() - 86400000 * (index + 1)).toISOString(),
  creator: {
    id: `c${index + 1}`,
    username: `creator_${index + 1}`,
    display_name: `Creator ${index + 1}`,
    avatar_url: null
  },
  tags: item.tags,
  like_count: Math.floor(Math.random() * 2000) + 500,
  is_liked: false,
  is_saved: false,
}));



type SortOption = "trending" | "newest" | "most_copied";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: prompts, isLoading: promptsLoading } = usePrompts({
    selectedTags,
    searchQuery,
    sortBy,
  });

  // Use real data if available, otherwise mock data
  const displayPrompts = prompts?.length ? prompts : MOCK_PROMPTS;
  // Always use fixed predefined tags - never changes based on user uploads
  const displayTags = [...STANDARD_TAGS];
  // Mobile tags - exclude solo, landscape, fashion, product shot (fits in 2 rows)
  const mobileExcludedTags = ["solo", "landscape", "fashion", "product shot"];
  const mobileTags = displayTags.filter(tag => !mobileExcludedTags.includes(tag));

  // Filter prompts by search and tags
  const filteredPrompts = useMemo(() => {
    let result = displayPrompts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.prompt_text.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        selectedTags.some((tag) => p.tags.includes(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result = [...result].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "most_copied":
        result = [...result].sort((a, b) => b.copy_count - a.copy_count);
        break;
      case "trending":
      default:
        result = [...result].sort(
          (a, b) => b.view_count + b.copy_count * 3 + b.like_count * 2 - (a.view_count + a.copy_count * 3 + a.like_count * 2)
        );
    }

    return result;
  }, [displayPrompts, searchQuery, selectedTags, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Convert filtered prompts to FeedItem format and prepare for future ad injection
  const feedItems: FeedItem[] = useMemo(() => {
    const imageItems = filteredPrompts.map(toImageFeedItem);

    // Ad injection ready - currently disabled (no ad provider)
    // When ads are ready, pass an ad generator function:
    // return injectAdvertisements(imageItems, 8, (index) => ({ type: "advertisement", data: { id: `ad-${index}` } }));

    return injectAdvertisements(imageItems, 8);
  }, [filteredPrompts]);

  // Render feed items using FeedCard
  const renderFeed = () => {
    return feedItems.map((item) => (
      <FeedCard
        key={item.type === "image" ? item.data.id : item.data.id}
        item={item}
        onLoginRequired={() => setAuthModalOpen(true)}
        onDelete={() => setRefreshKey(prev => prev + 1)}
      />
    ));
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showFilters={true}
      />

      <main className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        {/* Mobile: PARO Originals (replaces Browse by tags) */}
        <section className="md:hidden px-4 py-4 sm:py-6">
          <a
            href="/originals"
            className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gradient-to-r from-[hsl(var(--gold))]/10 to-transparent border border-[hsl(var(--gold))]/20 hover:border-[hsl(var(--gold))]/40 transition-all"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-[hsl(var(--gold))]" />
              <span className="font-serif text-base sm:text-lg">PARO Originals</span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">Coming Soon</span>
          </a>
        </section>

        {/* Tablet & Desktop: Tag Filter Section */}
        <section className="hidden md:block px-4 lg:px-6 xl:px-8 py-4 lg:py-6 xl:py-8">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="font-serif text-lg lg:text-xl text-muted-foreground">Browse by tags</h2>
              {/* Sort buttons - hidden on mobile, shown in hamburger menu */}
              <div className="hidden lg:flex gap-1 xl:gap-2">
                {(["trending", "newest", "most_copied"] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-2 xl:px-3 py-1 text-sm transition-colors rounded-sm ${sortBy === option
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {option === "most_copied" ? "Most copied" : option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <TagFilter
              tags={displayTags}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearAll={() => setSelectedTags([])}
            />
          </div>
        </section>

        {/* Main Prompt Feed */}
        <section className="px-4 sm:px-5 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 border-t border-border">
          <div className="max-w-[1920px] mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl mb-4 sm:mb-6">
              {sortBy === "trending" && "Trending Prompts"}
              {sortBy === "newest" && "Latest Prompts"}
              {sortBy === "most_copied" && "Most Copied Prompts"}
            </h2>

            {promptsLoading ? (
              <div className="masonry-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="masonry-item">
                    <Skeleton className="aspect-[3/4] rounded-sm" />
                    <Skeleton className="h-5 sm:h-6 mt-2 sm:mt-3 w-3/4" />
                    <Skeleton className="h-3 sm:h-4 mt-1.5 sm:mt-2 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <p className="font-serif text-lg sm:text-xl text-muted-foreground">
                  No prompts found
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="masonry-grid">
                {renderFeed()}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="login"
      />
    </div>
  );
}