/** The browser's Supabase client: sign-in, lists and rulebook edits. Row-level security applies,
 * because it holds only the publishable key. Components use it through src/api/hooks only. */
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
