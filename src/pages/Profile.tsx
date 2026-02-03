
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { EditPromptModal } from "@/components/prompts/EditPromptModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      if (!username) return null;
      // Get profile by username
      const data = await mockService.getProfileByUsername(username);
      return data;
    },
    enabled: !!username,
  });

  const { data: prompts, isLoading: promptsLoading, refetch: refetchPrompts } = useQuery({
    queryKey: ["profile-prompts", profile?.id, currentUserProfile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const allPrompts = await mockService.getPrompts();

      // Filter by creator ID
      const userPrompts = allPrompts.filter(p => p.creator_id === profile.id);

      // Sort
      userPrompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const enriched = await Promise.all(userPrompts.map(async (p) => {
        const creator = await mockService.getProfile(p.creator_id);
        const likeCount = mockService.getLikesCount(p.id);
        const isLiked = mockService.isLiked(currentUserProfile?.id, p.id);
        const isSaved = mockService.isSaved(currentUserProfile?.id, p.id);

        return {
          ...p,
          creator: creator || { id: "unknown", username: "unknown", display_name: "Unknown", avatar_url: null },
          tags: p.tags || [],
          like_count: likeCount,
          is_liked: isLiked,
          is_saved: isSaved
        };
      }));

      return enriched;
    },
    enabled: !!profile?.id,
  });

  // Check follow status and get follower count
  useEffect(() => {
    async function checkFollowStatus() {
      if (!profile?.id) return;

      const count = mockService.getFollowerCount(profile.id);
      setFollowerCount(count);

      if (currentUserProfile?.id) {
        const following = mockService.isFollowing(currentUserProfile.id, profile.id);
        setIsFollowing(following);
      }
    }

    checkFollowStatus();
  }, [profile?.id, currentUserProfile?.id]);

  const handleFollow = async () => {
    if (!user || !currentUserProfile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow creators",
      });
      return;
    }

    if (!profile?.id) return;

    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowerCount((prev) => (newFollowing ? prev + 1 : prev - 1));

    await mockService.toggleFollow(currentUserProfile.id, profile.id);
  };

  const handleDeletePrompt = async (promptId: string) => {
    // Mock delete
    // We didn't implement delete in mockService, let's just pretend or allow it
    // Actually, let's implement a simple filter out in mockService if we wanted persistence
    // For now, toast and fake refresh
    toast({ title: "Prompt deleted (Mock)" });
    refetchPrompts();
  };

  const isOwnProfile = currentUserProfile?.username === username;

  if (profileLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background">
        <Navbar />
        <main className="pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center py-8 sm:py-12">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mx-auto mt-4" />
            <Skeleton className="h-4 w-24 sm:w-32 mx-auto mt-2" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background">
        <Navbar />
        <main className="pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16">
          <h1 className="font-serif text-xl sm:text-2xl">Profile not found</h1>
          <Link to="/" className="text-muted-foreground hover:text-foreground mt-4 inline-block text-sm">
            Return home
          </Link>
        </main>
      </div>
    );
  }

  // @ts-ignore - cover_url might not be in types yet
  const coverUrl = profile.cover_url;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        {/* Cover Photo */}
        <div className="relative h-32 xs:h-40 sm:h-48 md:h-56 lg:h-64 bg-secondary overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
          )}
        </div>

        {/* Profile Header */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center -mt-10 sm:-mt-12 relative z-10">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-3 sm:mb-4 border-4 border-background">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="bg-secondary font-serif text-xl sm:text-2xl">
                {(profile.display_name || profile.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <h1 className="font-serif text-2xl sm:text-3xl mb-1">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">@{profile.username}</p>

            {profile.bio && (
              <p className="text-sm sm:text-base text-foreground/80 max-w-md mx-auto mb-4 sm:mb-6 px-4">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 mb-4 sm:mb-6 text-sm">
              <div>
                <span className="font-medium">{prompts?.length || 0}</span>
                <span className="text-muted-foreground ml-1">prompts</span>
              </div>
              <div>
                <span className="font-medium">{followerCount.toLocaleString()}</span>
                <span className="text-muted-foreground ml-1">followers</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-2"
                  aria-label="Website"
                >
                  <ExternalLink className="h-4 sm:h-5 w-4 sm:w-5" />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
                >
                  @{profile.twitter}
                </a>
              )}
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
                >
                  @{profile.instagram}
                </a>
              )}
            </div>

            {/* Follow Button */}
            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? "outline" : "default"}
                size="default"
                className="min-w-[100px]"
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}

            {isOwnProfile && (
              <Button variant="outline" size="default" asChild>
                <Link to="/settings">Edit Profile</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Prompts Grid */}
        <section className="px-4 sm:px-5 lg:px-6 xl:px-8 py-6 sm:py-8 border-t border-border mt-6 sm:mt-8">
          <div className="max-w-[1920px] mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl mb-4 sm:mb-6">Prompts</h2>

            {promptsLoading ? (
              <div className="masonry-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="masonry-item">
                    <Skeleton className="aspect-[3/4] rounded-sm" />
                  </div>
                ))}
              </div>
            ) : prompts?.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">No prompts yet</p>
              </div>
            ) : (
              <div className="masonry-grid">
                {prompts?.map((prompt: any) => (
                  <div key={prompt.id} className="masonry-item relative group/card">
                    <PromptCard
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
                      showEditButton={isOwnProfile}
                      onEditClick={() => setEditingPrompt(prompt)}
                      onLoginRequired={() => setAuthModalOpen(true)}
                    />

                    {isOwnProfile && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="absolute top-2 sm:top-3 left-2 sm:left-3 p-1.5 sm:p-2 rounded-full bg-destructive/90 text-destructive-foreground opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 transition-opacity z-10 touch-target flex items-center justify-center"
                            title="Delete prompt"
                            aria-label="Delete prompt"
                          >
                            <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your prompt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePrompt(prompt.id)}
                              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Edit Modal */}
      {editingPrompt && (
        <EditPromptModal
          isOpen={!!editingPrompt}
          onClose={() => setEditingPrompt(null)}
          prompt={{
            id: editingPrompt.id,
            title: editingPrompt.title,
            prompt_text: editingPrompt.prompt_text,
            image_url: editingPrompt.image_url,
            tool_used: editingPrompt.tool_used,
            tags: editingPrompt.tags,
          }}
          onUpdated={refetchPrompts}
        />
      )}

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="login"
      />
    </div>
  );
}