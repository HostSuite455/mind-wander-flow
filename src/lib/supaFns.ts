/**
 * Utilities for Supabase functions URL construction
 */

export const getFnsBase = () =>
  import.meta.env.VITE_SUPABASE_URL!.replace(".co", ".co/functions/v1");

/**
 * Constructs a Supabase edge function URL from the base Supabase URL
 * @param functionName - Name of the edge function
 * @param baseUrl - Base Supabase URL (optional, defaults to env variable)
 * @returns Complete function URL
 */
export function buildFunctionUrl(functionName: string, baseUrl?: string): string {
  const supabaseUrl = baseUrl || import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }

  // Convert https://project.supabase.co to https://project.supabase.co/functions/v1
  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
  
  return functionUrl;
}

/**
 * Gets the Supabase anon key from environment
 * @returns Anon key
 * @throws Error if key is missing
 */
export function getSupabaseAnonKey(): string {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
  }
  
  return anonKey;
}

/**
 * Creates headers for Supabase function calls
 * @param includeAuth - Whether to include authorization header
 * @returns Headers object
 */
export function createFunctionHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    headers.Authorization = `Bearer ${getSupabaseAnonKey()}`;
  }

  return headers;
}