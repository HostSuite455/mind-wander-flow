import { supabase } from "@/integrations/supabase/client";

// Helper function to safely get the current user
export async function getUserSafe() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

// Export the supabase client for direct usage
export { supabase };