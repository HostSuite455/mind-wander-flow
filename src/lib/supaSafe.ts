import { supabase } from "@/integrations/supabase/client";

export type SupaResult<T> = { data: T[]; error: any | null };

/** Safe Supabase select con fallback per RLS e colonne mancanti */
export async function supaSelect<T = any>(
  table: string,
  columns: string | null = null
): Promise<SupaResult<T>> {
  try {
    const { data, error } = await supabase.from(table as any).select(columns ?? "*");
    if (error) {
      // RLS / permessi
      if (
        error.message?.toLowerCase().includes("permission") ||
        error.message?.toLowerCase().includes("rls") ||
        error.code === "PGRST401"
      ) {
        console.warn("[RLS]", table, error.message);
        return { data: [], error: null };
      }
      // Colonne inesistenti → retry con *
      if (
        columns &&
        error.message?.toLowerCase().includes("column") &&
        error.message?.toLowerCase().includes("does not exist")
      ) {
        console.warn("[Missing Column]", table, error.message, "→ retry *");
        const { data: fallback, error: fbErr } = await supabase
          .from(table as any)
          .select("*");
        return { data: (fallback as T[]) ?? [], error: fbErr ?? null };
      }
      console.error("Supabase query error:", error);
      return { data: [], error };
    }
    return { data: (data as T[]) ?? [], error: null };
  } catch (err) {
    console.error("supaSelect caught error:", err);
    return { data: [], error: err };
  }
}

/** Extract name da campi comuni */
export function pickName(row: any): string {
  if (!row) return "—";
  return row.nome ?? row.name ?? row.title ?? "—";
}
