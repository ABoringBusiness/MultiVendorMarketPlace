import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const connection = () => {
  try {
    console.log("Supabase client initialized.");
  } catch (err) {
    console.log(`Some error occurred while connecting to database: ${err}`);
  }
};
