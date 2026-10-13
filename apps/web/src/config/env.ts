export const env = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3001",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  landingUrl: import.meta.env.VITE_LANDING_URL || "http://localhost:3000",
};
