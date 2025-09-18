import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SupaSelectResult<T = any> {
  data: T[] | null;
  error: any;
}

/**
 * Safe Supabase select with fallback handling for RLS and missing columns
 */
export async function supaSelect<T = any>(
  table: any, 
  columns: string | null = null
): Promise<SupaSelectResult<T>> {
  try {
    const selectColumns = columns ?? '*';
    const { data, error } = await supabase
      .from(table)
      .select(selectColumns);

    if (error) {
      // Check if it's an RLS/permission error
      if (error.message?.includes('permission') || error.message?.includes('RLS') || error.code === 'PGRST401') {
        console.warn('[RLS]', table, error.message);
        logWarn('RLS Permission denied for table:', table);
        return { data: [], error: null };
      }

      // Check if it's a missing column error
      if (error.message?.includes('column') && error.message?.includes('does not exist') && columns) {
        console.warn('[Missing Column]', table, error.message, '- retrying with *');
        logWarn('Missing column in table:', table, '- falling back to all columns');
        
        // Retry with '*'
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(table)
          .select('*');
          
        if (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          return { data: [], error: fallbackError };
        }
        
        return { data: (fallbackData as T[]) || [], error: null };
      }

      // Other errors
      console.error('Supabase query error:', error);
      return { data: [], error };
    }

    return { data: (data as T[]) || [], error: null };
    
  } catch (err) {
    console.error('supaSelect caught error:', err);
    return { data: [], error: err };
  }
}

/**
 * Extract name from various common name fields
 */
export function pickName(row: any): string {
  if (!row) return '—';
  return row.nome ?? row.name ?? row.title ?? '—';
}

/**
 * Development warning logger with toast integration
 */
export function logWarn(...args: any[]): void {
  const isDevelopment = localStorage.getItem('debug') === '1';
  
  if (isDevelopment) {
    console.warn('[Dev Mode]', ...args);
    toast({
      variant: "destructive",
      title: "Debug Warning",
      description: args.join(' '),
    });
  }
}
