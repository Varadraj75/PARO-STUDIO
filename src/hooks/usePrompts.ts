
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface PromptWithDetails {
  id: string;
  title: string;
  promptText: string;
  imageUrl: string;
  toolUsed: string;
  viewCount: number;
  copyCount: number;
  createdAt: string;
  tags: string[];
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export function usePrompts(options?: {
  selectedTags?: string[];
  searchQuery?: string;
  sortBy?: "trending" | "newest" | "most_copied";
  limit?: number;
}) {
  const { user, loading } = useAuth();
  const { selectedTags = [], searchQuery = "", sortBy = "trending", limit = 50 } = options || {};

  return useQuery({
    // Stable key - only includes search params, not auth state
    queryKey: ["prompts", selectedTags, searchQuery, sortBy, limit],
    queryFn: async () => {
      // Get all prompts from Supabase
      const { getAllPrompts } = await import('@/services/supabase/prompts');
      const { prompts: allPrompts, error } = await getAllPrompts(limit * 2); // Get more for filtering
      
      if (error) {
        console.error('Error fetching prompts:', error);
        return [];
      }

      // Filter by Search Query
      let filtered = allPrompts;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.prompt.toLowerCase().includes(query) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
        );
      }

      // Filter by Tags
      if (selectedTags.length > 0) {
        filtered = filtered.filter(p =>
          p.tags && selectedTags.some(tag => p.tags!.includes(tag))
        );
      }

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        } else if (sortBy === "most_copied") {
          return (b.copy_count || 0) - (a.copy_count || 0);
        } else {
          // Trending: View count for now
          return (b.view_count || 0) - (a.view_count || 0);
        }
      });

      // Limit
      filtered = filtered.slice(0, limit);

      // Enrich with Data from Supabase
      const { getProfile } = await import('@/services/supabase/profiles');
      const { getLikeCount, isLiked } = await import('@/services/supabase/likes');
      const { isSaved } = await import('@/services/supabase/saves');

      const enrichedPrompts: PromptWithDetails[] = await Promise.all(filtered.map(async (p) => {
        const profile = await getProfile(p.user_id);
        const likeCount = await getLikeCount(p.id);
        const liked = user ? await isLiked(user.id, p.id) : false;
        const saved = user ? await isSaved(user.id, p.id) : false;

        return {
          id: p.id,
          title: p.title,
          promptText: p.prompt,
          imageUrl: p.image_url,
          toolUsed: p.ai_tool,
          viewCount: p.view_count || 0,
          copyCount: p.copy_count || 0,
          createdAt: p.created_at || new Date().toISOString(),
          tags: p.tags || [],
          creator: profile ? {
            id: profile.id,
            username: profile.username || 'unknown',
            displayName: profile.full_name || profile.username || 'Unknown',
            avatarUrl: profile.avatar_url
          } : {
            id: p.user_id,
            username: 'unknown',
            displayName: 'Unknown User',
            avatarUrl: null
          },
          likeCount: likeCount,
          isLiked: liked,
          isSaved: saved
        };
      }));

      return enrichedPrompts;
    },
    // Wait for auth to stabilize before running query
    enabled: !loading,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      // Get all prompts and extract unique tags
      const { getAllPrompts } = await import('@/services/supabase/prompts');
      const { prompts, error } = await getAllPrompts(100);
      
      if (error || !prompts) return [];
      
      const tagsSet = new Set<string>();
      prompts.forEach(p => {
        p.tags?.forEach(tag => tagsSet.add(tag));
      });
      
      return Array.from(tagsSet).sort();
    },
  });
}

export function useTopCreators(limit = 6) {
  return useQuery({
    queryKey: ["top-creators", limit],
    queryFn: async () => {
      const { getAllPrompts } = await import('@/services/supabase/prompts');
      const { getProfile } = await import('@/services/supabase/profiles');
      const { prompts, error } = await getAllPrompts(200); // Get more prompts to find top creators

      if (error || !prompts) {
        console.error('Error fetching prompts for top creators:', error);
        return [];
      }

      const creatorIds = Array.from(new Set(prompts.map(p => p.user_id)));

      const stats = await Promise.all(creatorIds.map(async (id) => {
        const profile = await getProfile(id);
        if (!profile) return null;

        const userPrompts = prompts.filter(p => p.user_id === id);
        const promptCount = userPrompts.length;

        return {
          id: profile.id,
          username: profile.username || 'unknown',
          displayName: profile.full_name || profile.username || 'Unknown',
          avatarUrl: profile.avatar_url,
          promptCount,
        };
      }));

      return stats
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => b.promptCount - a.promptCount)
        .slice(0, limit);
    },
  });
}

