import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

let supabase;

if (process.env.NODE_ENV === 'test') {
  // For testing, we'll use the mock client
  const { createMockSupabase } = await import('../tests/mockFactories.js');
  supabase = createMockSupabase();
  console.log('Using mock Supabase client:', supabase);
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

// For testing purposes
export const setSupabaseForTesting = (mockClient) => {
  if (process.env.NODE_ENV === 'test') {
    supabase = mockClient;
  }
};
