/**
 * Supabase Authentication Service
 * 
 * Handles all authentication operations including OAuth, session management,
 * and profile creation.
 */

import { supabase } from './client';
import { createProfile, getProfile } from './profiles.js';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Sign in with Google OAuth
 * Opens OAuth flow in popup/redirect
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { data, error };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

/**
 * Ensure user has a profile in the profiles table
 * Creates one if it doesn't exist
 * 
 * CRITICAL: Only inserts AFTER verifying getUser() succeeds
 * This ensures auth.uid() is available in PostgREST RLS context
 */
export async function ensureProfile(user: User) {
  console.log('🔧 ensureProfile: Starting for user:', user.id);
  try {
    // MANDATORY: Verify auth context is ready before ANY database operation
    // Even if we have a session, auth.uid() might not be available in PostgREST yet
    console.log('🔧 ensureProfile: Verifying auth context with getUser()');
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !currentUser) {
      console.error('❌ ensureProfile: Auth context not ready:', userError);
      return { profile: null, error: userError || new Error('No authenticated user') };
    }

    console.log('✅ ensureProfile: Auth context verified, user:', currentUser.id);

    // Verify the user ID matches (sanity check)
    if (currentUser.id !== user.id) {
      console.error('❌ ensureProfile: User ID mismatch');
      return { profile: null, error: new Error('User ID mismatch') };
    }

    // Check if profile exists and fetch it in one query
    console.log('🔧 ensureProfile: Checking if profile exists');
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    console.log('🔧 ensureProfile: Profile check result:', {
      profileCount: existingProfiles?.length || 0,
      hasError: !!checkError,
      error: checkError,
      profiles: existingProfiles
    });

    if (checkError) {
      console.error('❌ ensureProfile: Error checking profile existence:', checkError);
      return { profile: null, error: checkError };
    }

    // Profile exists, return it directly
    if (existingProfiles && existingProfiles.length > 0) {
      console.log('✅ ensureProfile: Profile already exists, returning it');
      return { profile: existingProfiles[0], error: null };
    }

    // Profile doesn't exist, create it
    // At this point we've verified getUser() succeeded, so auth.uid() should be available
    console.log('🔧 ensureProfile: Profile does not exist, calling createProfile');
    const { profile, error } = await createProfile(currentUser);
    
    console.log('🔧 ensureProfile: createProfile result:', {
      hasProfile: !!profile,
      hasError: !!error,
      error: error,
      profileData: profile
    });

    if (error) {
      console.error('❌ ensureProfile: Error creating profile:', error);
      return { profile: null, error };
    }

    console.log('✅ ensureProfile: Successfully created profile');
    return { profile, error: null };
  } catch (error) {
    console.error('❌ ensureProfile: Exception caught:', error);
    return { profile: null, error };
  }
}
