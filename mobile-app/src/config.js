// Add the project's public URL and publishable key from Supabase Settings > API.
// These are safe for the app only because exposed tables use restrictive RLS.
export const SUPABASE_URL = 'https://rpjiwpzoolraimwgfujr.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_xhNehY62r1V-WnXt3Vrp3g_IPmaXmQI';
export const isSupabaseConfigured =
  !SUPABASE_URL.includes('YOUR_PROJECT_REF') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('REPLACE_WITH_PROJECT_KEY');

export const CITIES = ['Milwaukee', 'Chicago', 'Phoenix', 'Austin'];
export const CITY_META = {
  Milwaukee: { state: 'WI', latitude: 43.0389, longitude: -87.9065 },
  Chicago: { state: 'IL', latitude: 41.8781, longitude: -87.6298 },
  Phoenix: { state: 'AZ', latitude: 33.4484, longitude: -112.074 },
  Austin: { state: 'TX', latitude: 30.2672, longitude: -97.7431 },
};
