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
  
  if (userErr || !user) {
    const errorMsg = userErr?.message || "Utente non autenticato";
    console.error("Auth error:", userErr);
    return { data: null, error: new Error(errorMsg) };
  }

  const payload = {
    nome: input.nome.trim(),
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
    max_guests: Number.isFinite(input.max_guests) ? input.max_guests : null,
    status: (input.status || "active") as "active" | "inactive",
    host_id: user.id,  // Required for RLS
  };

  console.log("Creating property with payload:", payload);

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id, nome, city, address, max_guests, status, created_at, host_id")
    .single();

  if (error) {
    console.error("Property creation error:", error);
    // Debug mode error details
    if (localStorage.getItem('debug') === '1') {
      console.error("RLS error details:", { 
        message: error.message, 
        details: error.details, 
        hint: error.hint 
      });
    }
  }

  return { data, error };
}