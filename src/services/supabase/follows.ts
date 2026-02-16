/**
 * Supabase Follows Service
 * Handles follow CRUD operations
 */

import { supabase } from './client';

/**
 * Check if a user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .match({ follower_id: followerId, following_id: followingId })
    .maybeSingle();

  if (error) {
    console.error('Error checking follow status:', error);
    return false;
  }

  return data !== null;
}

/**
 * Get follower count for a user
 */
export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    console.error('Error getting following count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Toggle follow status (insert if not exists, delete if exists)
 */
export async function toggleFollow(followerId: string, followingId: string): Promise<{ error: any }> {
  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .match({ follower_id: followerId, following_id: followingId })
    .maybeSingle();

  if (existing) {
    // Unfollow
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });
    
    return { error };
  } else {
    // Follow
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    
    return { error };
  }
}
