/**
 * Supabase Profiles Service
 * 
 * Handles profile CRUD operations
 */

import { supabase } from './client';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - profile doesn't exist
      return null;
    }
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Get profile by username (for checking availability)
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile by username:', error);
    return null;
  }

  return data;
}

/**
 * Create a new profile from auth user
 * Only inserts minimal required fields to avoid RLS issues
 */
export async function createProfile(user: User) {
  console.log('📝 createProfile: Starting for user:', user.id);
  
  // Use minimal insert shape as specified
  // NOTE: profiles table has id, username, full_name, avatar_url, cover_url, bio, website
  // Website column exists in DB but unused in frontend (left for potential future use)
  const profile = {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  };

  console.log('📝 createProfile: Attempting insert with data:', profile);

  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single();

  if (error) {
    console.error('❌ createProfile: Insert failed:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      fullError: error
    });
    return { profile: null, error };
  }

  console.log('✅ createProfile: Successfully inserted profile:', data);
  return { profile: data, error: null };
}

/**
 * Update user profile with validation
 */
export async function updateProfile(userId: string, updates: UpdateProfileData) {
  console.log('📝 updateProfile: Starting for user:', userId, updates);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('❌ updateProfile: Failed:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    
    // Handle unique constraint violation for username
    if (error.code === '23505') {
      return { 
        profile: null, 
        error: {
          ...error,
          message: 'Username already taken'
        }
      };
    }
    
    return { profile: null, error };
  }

  console.log('✅ updateProfile: Successfully updated:', data);
  return { profile: data, error: null };
}
