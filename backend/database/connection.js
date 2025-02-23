import { config } from 'dotenv';
config(); // Load environment variables first

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghwxuebuaeokvcyviatx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const connection = () => {
  try {
    console.log("Supabase client initialized with URL:", supabaseUrl);
  } catch (err) {
    console.log(`Some error occurred while connecting to database: ${err}`);
  }
};
