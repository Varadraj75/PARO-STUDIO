
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Liked() {
  const { user, profile } = useAuth();

  // Fetch liked prompts
  const { data: likedPrompts, isLoading, refetch } = useQuery({
    queryKey: ["liked-prompts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const allPrompts = await mockService.getPrompts();

      // Filter for liked prompts
      const liked = allPrompts.filter(p => mockService.isLiked(profile.id, p.id));

      const enriched = await Promise.all(liked.map(async (p) => {
        const creator = await mockService.getProfile(p.creator_id);
        const likeCount = mockService.getLikesCount(p.id);
        const isSaved = mockService.isSaved(profile.id, p.id);

        return {
          ...p,
          creator: creator || { id: "unknown", username: "unknown", display_name: "Unknown", avatar_url: null },
          like_count: likeCount,
          is_liked: true,
          is_saved: isSaved
        };
      }));

      return enriched;
    },
    enabled: !!profile?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24 container mx-auto px-4 lg:px-8 text-center py-16">
          <h1 className="font-serif text-2xl mb-4">Sign in to view liked prompts</h1>
          <p className="text-muted-foreground">
            Your liked prompts will appear here
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Heart className="h-6 w-6 text-destructive" />
            <h1 className="font-serif text-3xl">Liked Prompts</h1>
          </div>

          {isLoading ? (
            <div className="masonry-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="masonry-item">
                  <Skeleton className="aspect-[3/4] rounded-sm" />
                </div>
              ))}
            </div>
          ) : likedPrompts?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No liked prompts yet</p>
              <Link to="/" className="text-gold hover:underline">
                Explore prompts
              </Link>
            </div>
          ) : (
            <div className="masonry-grid">
              {likedPrompts?.map((prompt: any) => (
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
      </main>

      <Footer />
    </div>
  );
}
