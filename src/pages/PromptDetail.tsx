
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Heart, Bookmark, Check, ArrowLeft } from "lucide-react";
import { mockService } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PromptCard } from "@/components/prompts/PromptCard";
import { AuthModal } from "@/components/auth/AuthModal";

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: prompt, isLoading } = useQuery({
    queryKey: ["prompt", id, user?.id],
    queryFn: async () => {
      if (!id) return null;
      const data = await mockService.getPrompt(id);

      if (!data) return null;

      // Increment view count (mock)
      // await supabase... (skipped, we don't have updatePrompt exposed fully but view count isn't critical for mock)

      const creator = await mockService.getProfile(data.creator_id);

      const likeCount = mockService.getLikesCount(id);
      const isLiked = mockService.isLiked(user?.id, id);
      const isSaved = mockService.isSaved(user?.id, id);

      const result = {
        ...data,
        creator: creator || { id: "unknown", username: "unknown", display_name: "Unknown", avatar_url: null },
        tags: data.tags || [],
        like_count: likeCount,
        is_liked: isLiked,
        is_saved: isSaved,
      };

      setIsLiked(result.is_liked);
      setIsSaved(result.is_saved);
      setLikeCount(result.like_count);

      return result;
    },
    enabled: !!id,
  });

  // Fetch recommended prompts based on matching tags
  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", id, prompt?.tags, user?.id],
    queryFn: async () => {
      if (!prompt?.tags || prompt.tags.length === 0 || !id) return [];

      const allPrompts = await mockService.getPrompts();

      // Filter excluding current and matching tags
      const filtered = allPrompts.filter(p =>
        p.id !== id && p.tags.some(t => prompt.tags.includes(t))
      ).slice(0, 12);

      // Transform
      const enriched = await Promise.all(filtered.map(async (p) => {
        const creator = await mockService.getProfile(p.creator_id);
        const isLiked = mockService.isLiked(user?.id, p.id);
        const isSaved = mockService.isSaved(user?.id, p.id);

        return {
          ...p,
          creator: creator || { id: "unknown", username: "unknown", display_name: "Unknown", avatar_url: null },
          like_count: mockService.getLikesCount(p.id),
          is_liked: isLiked,
          is_saved: isSaved
        };
      }));

      return enriched;
    },
    enabled: !!prompt?.tags && prompt.tags.length > 0,
  });

  const handleCopy = async () => {
    if (!prompt) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);

    await mockService.incrementCopyCount(prompt.id);

    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Prompt copied to clipboard" });
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like prompts",
      });
      return;
    }

    if (!profile || !prompt) {
      toast({
        title: "Profile loading",
        description: "Please wait for your profile to load",
      });
      return;
    }

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    await mockService.toggleLike(profile.id, prompt.id);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save prompts",
      });
      return;
    }

    if (!profile || !prompt) {
      toast({
        title: "Profile loading",
        description: "Please wait for your profile to load",
      });
      return;
    }

    const newSaved = !isSaved;
    setIsSaved(newSaved);

    await mockService.toggleSave(profile.id, prompt.id);

    if (newSaved) {
      toast({ title: "Saved to collection" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background">
        <Navbar />
        <main className="pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6 items-start py-4">
            <Skeleton className="w-full lg:w-2/5 aspect-square rounded-sm" />
            <div className="w-full lg:w-3/5 space-y-3 sm:space-y-4">
              <Skeleton className="h-6 sm:h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 sm:h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background">
        <Navbar />
        <main className="pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16">
          <h1 className="font-serif text-xl sm:text-2xl">Prompt not found</h1>
          <Link to="/" className="text-muted-foreground hover:text-foreground mt-4 inline-block text-sm">
            Return home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        {/* Main content section - compact to show recommendations without scroll */}
        <section className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Back button */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4 text-sm"
            >
              <ArrowLeft className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              <span>Back</span>
            </Link>

            {/* Main content - side by side on desktop, stacked on mobile */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
              {/* Image - constrained height with responsive sizing */}
              <div className="w-full lg:w-2/5 flex items-start justify-center">
                <img
                  src={prompt.image_url}
                  alt={prompt.title}
                  className="max-h-[40vh] sm:max-h-[35vh] lg:max-h-[50vh] w-auto max-w-full object-contain rounded-sm shadow-card"
                  loading="lazy"
                />
              </div>

              {/* Content - compact layout */}
              <div className="w-full lg:w-3/5 flex flex-col gap-2.5 sm:gap-3">
                {/* Title */}
                <h1 className="font-serif text-lg sm:text-xl lg:text-2xl leading-tight">
                  {prompt.title}
                </h1>

                {/* Creator */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link to={`/profile/${prompt.creator.id}`}>
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                      <AvatarImage src={prompt.creator.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary font-serif text-xs">
                        {(prompt.creator.display_name || prompt.creator.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${prompt.creator.id}`}
                      className="text-sm font-medium hover:text-gold transition-colors"
                    >
                      {prompt.creator.display_name || prompt.creator.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{prompt.creator.username}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Copy className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span className="tabular-nums">{prompt.copy_count.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span className="tabular-nums">{likeCount.toLocaleString()}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-secondary rounded-sm">
                    {prompt.tool_used}
                  </span>
                </div>

                {/* Actions - Responsive button sizes */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Button
                    onClick={handleCopy}
                    size="default"
                    className={cn(
                      "gap-1.5 sm:gap-2 text-sm",
                      copied && "bg-gold text-gold-foreground"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        <span className="hidden xs:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        <span className="hidden xs:inline">Copy Prompt</span>
                        <span className="xs:hidden">Copy</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleLike}
                    className={cn("p-2 sm:px-3", isLiked && "border-destructive/50")}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        isLiked && "fill-destructive text-destructive"
                      )}
                    />
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleSave}
                    className={cn("p-2 sm:px-3", isSaved && "border-gold/50")}
                    aria-label={isSaved ? "Unsave" : "Save"}
                  >
                    <Bookmark
                      className={cn("h-4 w-4", isSaved && "fill-gold text-gold")}
                    />
                  </Button>
                </div>

                {/* Tags */}
                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {prompt.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        to={`/?tag=${tag}`}
                        className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-sm hover:bg-secondary/80 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Prompts - Immediately visible */}
        {recommendations && recommendations.length > 0 && (
          <section className="border-t border-border py-4 sm:py-6 lg:py-8 mt-2 sm:mt-4">
            <div className="px-4 sm:px-5 lg:px-6 xl:px-8">
              <div className="max-w-[1920px] mx-auto">
                <h2 className="font-serif text-lg sm:text-xl mb-3 sm:mb-4">More like this</h2>

                <div className="masonry-grid">
                  {recommendations.slice(0, 8).map((rec: any) => (
                    <PromptCard
                      key={rec.id}
                      id={rec.id}
                      title={rec.title}
                      promptText={rec.prompt_text}
                      imageUrl={rec.image_url}
                      toolUsed={rec.tool_used}
                      viewCount={rec.view_count}
                      copyCount={rec.copy_count}
                      likeCount={rec.like_count}
                      creator={rec.creator}
                      tags={rec.tags}
                      isLiked={rec.is_liked}
                      isSaved={rec.is_saved}
                      onLoginRequired={() => setAuthModalOpen(true)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
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