/**
 * Supabase Services Index
 * 
 * Re-exports Supabase client and types for convenient importing.
 * 
 * Usage:
 * import { supabase } from '@/services/supabase';
 * import * as supabaseAuth from '@/services/supabase/auth';
 */

export { supabase } from './client';
export type { Database } from './database.types';
export * as auth from './auth';
export * as profiles from './profiles';
export type { Profile } from './profiles';
