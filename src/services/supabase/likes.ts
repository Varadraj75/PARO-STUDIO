/**
 * Supabase Likes Service
 * Handles like CRUD operations
 */

import { supabase } from './client';

/**
 * Check if a user has liked a prompt
 */
export async function isLiked(userId: string, promptId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .match({ user_id: userId, prompt_id: promptId })
    .maybeSingle();

  if (error) {
    console.error('Error checking like status:', error);
    return false;
  }

  return data !== null;
}

/**
 * Get like count for a prompt
 */
export async function getLikeCount(promptId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_id', promptId);

  if (error) {
    console.error('Error getting like count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Toggle like status (insert if not exists, delete if exists)
 */
export async function toggleLike(userId: string, promptId: string): Promise<{ error: any }> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .match({ user_id: userId, prompt_id: promptId })
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ user_id: userId, prompt_id: promptId });
    
    return { error };
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, prompt_id: promptId });
    
    return { error };
  }
}

/**
 * Get all prompts liked by a user (for Liked page)
 * Returns prompts with join
 */
export async function getUserLikes(userId: string): Promise<{ prompts: any[]; error: any }> {
  const { data, error } = await supabase
    .from('likes')
    .select(`
      prompt_id,
      prompts (
        id,
        user_id,
        title,
        prompt,
        image_url,
        ai_tool,
        tags,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { prompts: [], error };
  }

  // Flatten and normalize to camelCase (match PromptWithDetails shape)
  const prompts = (data || [])
    .filter(item => item.prompts !== null)
    .map(item => {
      const p = item.prompts as any; // Supabase nested select type
      return {
        id: p.id,
        userId: p.user_id,
        title: p.title,
        promptText: p.prompt,
        imageUrl: p.image_url,
        toolUsed: p.ai_tool,
        tags: p.tags || [],
        createdAt: p.created_at,
      };
    });

  return { prompts, error: null };
}
