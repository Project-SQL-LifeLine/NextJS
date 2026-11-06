import { createClient } from '@supabase/supabase-js';

// এনভায়রনমেন্ট ভেরিয়েবল থেকে ডাটা নেওয়া
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// যদি ভেরিয়েবল না থাকে, তবে এরর না দিয়ে সতর্কবার্তা দেখাবে (যাতে বিল্ড ফেইল না করে)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
