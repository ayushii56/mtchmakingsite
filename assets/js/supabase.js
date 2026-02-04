// assets/js/supabase.js

const SUPABASE_URL = "https://dukeyotuwijkbdrdlvzc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1a2V5b3R1d2lqa2JkcmRsdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjI0MTcsImV4cCI6MjA4NTc5ODQxN30.mPgFpuOirJh_G_btd4xvnsxIkI0ytF5nfvs7hgMt5co";

// IMPORTANT: different variable name
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// expose globally
window.supabaseClient = supabaseClient;
