import { supabase } from "./supabaseClient";

// API calls go through Vercel Edge proxy (/api) — real backend URL is server-side only
export const API_URL = "/api";

/** Get current Supabase access token for API calls */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
