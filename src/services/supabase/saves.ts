/**
 * Supabase Saves Service
 * Handles save CRUD operations
 */

import { supabase } from './client';

/**
 * Check if a user has saved a prompt
 */
export async function isSaved(userId: string, promptId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('saves')
    .select('id')
    .match({ user_id: userId, prompt_id: promptId })
    .maybeSingle();

  if (error) {
    console.error('Error checking save status:', error);
    return false;
  }

  return data !== null;
}

/**
 * Toggle save status (insert if not exists, delete if exists)
 */
export async function toggleSave(userId: string, promptId: string): Promise<{ error: any }> {
  // Check if already saved
  const { data: existing } = await supabase
    .from('saves')
    .select('id')
    .match({ user_id: userId, prompt_id: promptId })
    .maybeSingle();

  if (existing) {
    // Unsave
    const { error } = await supabase
      .from('saves')
      .delete()
      .match({ user_id: userId, prompt_id: promptId });
    
    return { error };
  } else {
    // Save
    const { error } = await supabase
      .from('saves')
      .insert({ user_id: userId, prompt_id: promptId });
    
    return { error };
  }
}

/**
 * Get all prompts saved by a user (for Saved page)
 * Returns prompts with join
 */
export async function getUserSaves(userId: string): Promise<{ prompts: any[]; error: any }> {
  const { data, error } = await supabase
    .from('saves')
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
