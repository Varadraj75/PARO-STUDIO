/**
 * Supabase Database Types
 * 
 * This file contains TypeScript types for your Supabase database schema.
 * 
 * To generate these types automatically:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Run: supabase gen types typescript --project-id YOUR_PROJECT_ID > src/services/supabase/database.types.ts
 * 
 * For now, we export a placeholder type that will be replaced during migration.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}
