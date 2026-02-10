/**
 * Supabase Client Test
 * 
 * Simple test to verify the Supabase client is properly initialized.
 * This can be imported in any component to test the connection.
 */

import { supabase } from './client';

/**
 * Test Supabase client initialization
 * Logs the client status to console
 */
export function testSupabaseClient() {
  console.log('🔧 Testing Supabase Client...');
  
  if (!supabase) {
    console.error('❌ Supabase client is not initialized');
    return false;
  }
  
  console.log('✅ Supabase client initialized successfully');
  console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not configured');
  console.log('🔑 Anon Key configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  return true;
}

// Uncomment to run test on import (useful for debugging)
// testSupabaseClient();
