
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Saved() {
  const { user, profile } = useAuth();

  // Fetch saved prompts
  const { data: savedPrompts, isLoading, refetch } = useQuery({
    queryKey: ["saved-prompts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const allPrompts = await mockService.getPrompts();

      // Filter for saved prompts
      const saved = allPrompts.filter(p => mockService.isSaved(profile.id, p.id));

      const enriched = await Promise.all(saved.map(async (p) => {
        const creator = await mockService.getProfile(p.creator_id);
        const likeCount = mockService.getLikesCount(p.id);
        const isLiked = mockService.isLiked(profile.id, p.id);

        return {
          ...p,
          creator: creator || { id: "unknown", username: "unknown", display_name: "Unknown", avatar_url: null },
          like_count: likeCount,
          is_liked: isLiked,
          is_saved: true
        };
      }));

      return enriched;
    },
    enabled: !!profile?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16">
          <h1 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4">Sign in to view saved prompts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your saved prompts will appear here
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        <div className="px-4 sm:px-5 lg:px-6 xl:px-8 py-8 sm:py-10 lg:py-12">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
              <h1 className="font-serif text-2xl sm:text-3xl">Saved Prompts</h1>
            </div>

            {isLoading ? (
              <div className="masonry-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="masonry-item">
                    <Skeleton className="aspect-[3/4] rounded-sm" />
                  </div>
                ))}
              </div>
            ) : savedPrompts?.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">No saved prompts yet</p>
                <Link to="/" className="text-gold hover:underline text-sm sm:text-base">
                  Explore prompts
                </Link>
              </div>
            ) : (
              <div className="masonry-grid">
                {savedPrompts?.map((prompt: any) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    title={prompt.title}
                    promptText={prompt.prompt_text}
                    imageUrl={prompt.image_url}
                    toolUsed={prompt.tool_used}
                    viewCount={prompt.view_count}
                    copyCount={prompt.copy_count}
                    likeCount={prompt.like_count}
                    creator={prompt.creator}
                    tags={prompt.tags}
                    isLiked={prompt.is_liked}
                    isSaved={prompt.is_saved}
                    onLikeChange={refetch}
                    onSaveChange={refetch}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}