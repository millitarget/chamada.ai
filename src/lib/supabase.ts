import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For production environments - graceful fallback if variables are missing
const isMissingCredentials = !supabaseUrl || !supabaseAnonKey;

if (isMissingCredentials) {
  console.error('Supabase credentials are missing. Rate limiting will be disabled.');
}

// Create a mock client if credentials are missing in production
// This prevents the app from crashing, but rate limiting won't work
const createMockClient = () => {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
};

// Only create the real client if credentials are available
export const supabase = isMissingCredentials 
  ? (createMockClient() as any)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        // Log all executed queries for debugging
        fetch: (url, options) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Supabase Query to ${url}`);
          }
          return fetch(url, options);
        },
      }
    }); 