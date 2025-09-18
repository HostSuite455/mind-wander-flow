import { supabase } from "@/integrations/supabase/client";

export type NewProperty = {
  nome: string;
  city?: string;
  address?: string;
  max_guests?: number | null;
  status?: "active" | "inactive";
};

export async function createProperty(input: NewProperty) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return { data: null, error: userErr || new Error("Not authenticated") };

  const payload = {
    nome: input.nome.trim(),
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
    max_guests: input.max_guests ?? null,
    status: (input.status || "active") as "active" | "inactive",
    host_id: user.id,            // <- IMPORTANT (matches RLS)
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id, nome, city, address, max_guests, status, created_at")
    .single();

  return { data, error };
}