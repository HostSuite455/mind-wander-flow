import { supabase } from "@/integrations/supabase/client";

export type NewProperty = {
  nome: string;
  city?: string;
  max_guests?: number;
  status?: "active" | "inactive";
  address?: string;
};

export async function createProperty(input: NewProperty) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { data: null, error: userErr ?? new Error("Not authenticated") };

  const row = {
    host_id: user.id,
    nome: input.nome.trim(),
    city: input.city?.trim() || null,
    max_guests: input.max_guests ?? null,
    status: input.status ?? "active",
    address: input.address?.trim() || null,
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(row)
    .select("id, host_id, nome, city, max_guests, status, address, created_at")
    .single();

  return { data, error };
}