
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { mockService, Prompt } from "@/lib/mockData";

export interface PromptWithDetails extends Omit<Prompt, "creator_id"> {
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  like_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

export function usePrompts(options?: {
  selectedTags?: string[];
  searchQuery?: string;
  sortBy?: "trending" | "newest" | "most_copied";
  limit?: number;
}) {
  const { user } = useAuth();
  const { selectedTags = [], searchQuery = "", sortBy = "trending", limit = 50 } = options || {};

  return useQuery({
    queryKey: ["prompts", selectedTags, searchQuery, sortBy, limit, user?.id],
    queryFn: async () => {
      // Get all raw prompts
      const allPrompts = await mockService.getPrompts();

      // Filter by Search Query
      let filtered = allPrompts;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.prompt_text.toLowerCase().includes(query) ||
          p.tags.some(t => t.toLowerCase().includes(query))
        );
      }

      // Filter by Tags
      if (selectedTags.length > 0) {
        filtered = filtered.filter(p =>
          selectedTags.some(tag => p.tags.includes(tag))
        );
      }

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === "most_copied") {
          return b.copy_count - a.copy_count;
        } else {
          // Trending: View count for now
          return b.view_count - a.view_count;
        }
      });

      // Limit
      filtered = filtered.slice(0, limit);

      // Enrich with Data
      const enrichedPrompts: PromptWithDetails[] = await Promise.all(filtered.map(async (p) => {
        const creator = await mockService.getProfile(p.creator_id);
        const likeCount = mockService.getLikesCount(p.id);
        const isLiked = mockService.isLiked(user?.id, p.id);
        const isSaved = mockService.isSaved(user?.id, p.id);

        return {
          ...p,
          creator: creator || {
            id: "unknown",
            username: "unknown",
            display_name: "Unknown User",
            avatar_url: null
          },
          like_count: likeCount,
          is_liked: isLiked,
          is_saved: isSaved
        };
      }));

      return enrichedPrompts;
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      return mockService.getTags();
    },
  });
}

export function useTopCreators(limit = 6) {
  return useQuery({
    queryKey: ["top-creators", limit],
    queryFn: async () => {
      // Since we don't have a direct list of users in the service interface (private),
      // we might cheat or add a getTopCreators to mockService.
      // For now, let's just return the few profiles we know we have by iterating prompts or hardcoded IDs.
      // Or better, let's add `getPrompts` and aggregate.

      const prompts = await mockService.getPrompts();
      const creatorIds = Array.from(new Set(prompts.map(p => p.creator_id)));

      const stats = await Promise.all(creatorIds.map(async (id) => {
        const profile = await mockService.getProfile(id);
        if (!profile) return null;

        const userPrompts = prompts.filter(p => p.creator_id === id);
        const promptCount = userPrompts.length;
        // Fake follower count based on prompt count or random
        const followerCount = promptCount * 5 + Math.floor(Math.random() * 50);

        return {
          ...profile,
          promptCount,
          followerCount
        };
      }));

      const validStats = stats.filter((s): s is NonNullable<typeof s> => s !== null);

      return validStats.sort((a, b) => b.followerCount - a.followerCount).slice(0, limit);
    },
  });
}
