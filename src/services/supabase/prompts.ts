/**
 * Supabase Prompts Service
 * Handles prompt CRUD operations
 */

import { supabase } from './client';

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  image_url: string;
  ai_tool: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreatePromptData {
  user_id: string;
  title: string;
  prompt: string;
  image_url: string;
  ai_tool: string;
  tags?: string[];
}

/**
 * Create a new prompt
 * CRITICAL: user_id must be explicitly passed and match auth.uid() for RLS
 */
export async function createPrompt(data: CreatePromptData) {
  console.log('📝 createPrompt: Starting with data:', {
    user_id: data.user_id,
    title: data.title,
    prompt: data.prompt.substring(0, 50) + '...',
    image_url: data.image_url,
    ai_tool: data.ai_tool,
    tags: data.tags
  });

  const { data: prompt, error } = await supabase
    .from('prompts')
    .insert([{
      user_id: data.user_id,
      title: data.title,
      prompt: data.prompt,
      image_url: data.image_url,
      ai_tool: data.ai_tool,
      tags: data.tags || []
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ createPrompt: Insert failed:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return { prompt: null, error };
  }

  // CRITICAL: Verify the inserted row has id and user_id
  console.log('✅ createPrompt: Successfully created prompt');
  console.log('📊 createPrompt: Inserted row:', {
    id: prompt?.id,
    user_id: prompt?.user_id,
    title: prompt?.title,
    hasId: !!prompt?.id,
    hasUserId: !!prompt?.user_id,
    fullPrompt: prompt
  });

  if (!prompt?.id) {
    console.error('❌ createPrompt: WARNING - No ID in inserted row!');
  }
  
  if (!prompt?.user_id) {
    console.error('❌ createPrompt: WARNING - No user_id in inserted row!');
  }

  return { prompt, error: null };
}

/**
 * Get prompt by ID
 * Should be accessible publicly (read access for all)
 */
export async function getPrompt(id: string) {
  console.log('🔍 getPrompt: Fetching prompt:', id);
  
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ getPrompt: Fetch failed:', {
      promptId: id,
      code: error.code,
      message: error.message,
      details: error.details
    });
    return { prompt: null, error };
  }

  console.log('✅ getPrompt: Successfully fetched:', {
    id: data?.id,
    user_id: data?.user_id,
    title: data?.title,
    hasData: !!data
  });

  return { prompt: data, error: null };
}

/**
 * Get prompts by user
 */
export async function getUserPrompts(userId: string) {
  console.log('🔍 getUserPrompts: Fetching prompts for user:', userId);
  
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getUserPrompts: Fetch failed:', error);
    return { prompts: [], error };
  }

  // Normalize to camelCase (match PromptWithDetails shape)
  const normalizedPrompts = (data || []).map(p => ({
    id: p.id,
    userId: p.user_id,
    title: p.title,
    promptText: p.prompt,
    imageUrl: p.image_url,
    toolUsed: p.ai_tool,
    tags: p.tags || [],
    createdAt: p.created_at,
  }));

  console.log('✅ getUserPrompts: Found', normalizedPrompts.length, 'prompts');
  return { prompts: normalizedPrompts, error: null };
}

/**
 * Get all prompts (for main feed)
 * Should be accessible publicly (read access for all)
 */
export async function getAllPrompts(limit = 50) {
  console.log('🔍 getAllPrompts: Fetching prompts from public.prompts, limit:', limit);
  
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ getAllPrompts: Fetch failed:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return { prompts: [], error };
  }

  console.log('✅ getAllPrompts: Successfully fetched', data?.length || 0, 'prompts');
  if (data && data.length > 0) {
    console.log('📊 getAllPrompts: Sample prompt:', {
      id: data[0].id,
      user_id: data[0].user_id,
      title: data[0].title
    });
  }

  return { prompts: data || [], error: null };
}

/**
 * Update prompt
 */
export async function updatePrompt(id: string, userId: string, updates: Partial<CreatePromptData>) {
  const { data, error } = await supabase
    .from('prompts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId) // RLS check
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt:', error);
    return { prompt: null, error };
  }

  return { prompt: data, error: null };
}


/**
 * Increment copy count for a prompt
 */
export async function incrementCopyCount(promptId: string): Promise<{ error: any }> {
  const { error } = await supabase.rpc('increment_copy_count', {
    prompt_id: promptId
  });

  if (error) {
    console.error('Error incrementing copy count:', error);
  }

  return { error };
}

/**
 * Delete prompt
 */
export async function deletePrompt(id: string, userId: string) {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId); // RLS check

  if (error) {
    console.error('Error deleting prompt:', error);
    return { error };
  }

  return { error: null };
}
