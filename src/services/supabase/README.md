# Supabase Services

This directory contains the Supabase client configuration and related services for the PARO application.

## Setup

### 1. Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Note:** The anon key is safe to expose in the frontend. Security is enforced through Row Level Security (RLS) policies in your Supabase database.

### 2. Usage

Import the Supabase client anywhere in your application:

```typescript
import { supabase } from '@/services/supabase';

// Example: Query data
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .limit(10);
```

## File Structure

```
src/services/supabase/
├── client.ts           # Supabase client initialization
├── database.types.ts   # TypeScript types for database schema
├── index.ts           # Re-exports for convenient importing
└── README.md          # This file
```

## Current Status

✅ **Completed:**
- Supabase client installed and configured
- Environment variable setup
- TypeScript types placeholder

⏳ **Pending (Future Migration):**
- Authentication services
- Database query services
- Storage services
- Edge Functions integration

## Security

- ✅ Only uses public anon key (safe for frontend)
- ✅ No service role keys in frontend code
- ✅ Session persistence disabled until auth migration
- ✅ Auto-refresh disabled until auth migration

## Next Steps

During the backend migration, we will:

1. Generate actual database types from Supabase schema
2. Implement authentication services
3. Create database query services
4. Set up storage services for image uploads
5. Enable session management and auto-refresh

See `architecture_plan.md` for the full migration roadmap.
