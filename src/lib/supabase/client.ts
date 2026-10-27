import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/env";

/** Supabase client untuk Client Components. */
export function createClient() {
  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
