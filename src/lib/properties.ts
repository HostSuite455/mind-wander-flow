import { supabase } from "@/integrations/supabase/client";

export type Property = {
  id: string;
  host_id: string;
  nome: string;
  city?: string;
  address?: string;
  country?: string;
  lat?: number;
  lng?: number;
  size_sqm?: number;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  base_price?: number;
  cleaning_fee?: number;
  currency?: string;
  check_in_from?: string;
  check_out_until?: string;
  amenities?: Record<string, boolean>;
  status?: "draft" | "active" | "inactive";
  timezone?: string;
  created_at?: string;
};

export type NewProperty = {
  nome: string;
  city?: string;
  address?: string;
  country?: string;
  lat?: number;
  lng?: number;
  size_sqm?: number;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  base_price?: number;
  cleaning_fee?: number;
  currency?: string;
  check_in_from?: string;
  check_out_until?: string;
  amenities?: Record<string, boolean>;
  status?: "draft" | "active" | "inactive";
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
    country: input.country?.trim() || null,
    lat: input.lat || null,
    lng: input.lng || null,
    size_sqm: input.size_sqm || null,
    guests: input.guests || null,
    bedrooms: input.bedrooms || null,
    beds: input.beds || null,
    bathrooms: input.bathrooms || null,
    base_price: input.base_price || null,
    cleaning_fee: input.cleaning_fee || null,
    currency: input.currency || 'EUR',
    check_in_from: input.check_in_from || null,
    check_out_until: input.check_out_until || null,
    amenities: input.amenities || {},
    status: (input.status || "active") as "draft" | "active" | "inactive",
    host_id: user.id,  // Required for RLS
  };

  console.log("Creating property with payload:", payload);

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("*")
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

export async function updateProperty(id: string, input: Partial<NewProperty>) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  
  if (userErr || !user) {
    const errorMsg = userErr?.message || "Utente non autenticato";
    console.error("Auth error:", userErr);
    return { data: null, error: new Error(errorMsg) };
  }

  const payload: any = {};
  
  if (input.nome !== undefined) payload.nome = input.nome.trim();
  if (input.city !== undefined) payload.city = input.city?.trim() || null;
  if (input.address !== undefined) payload.address = input.address?.trim() || null;
  if (input.country !== undefined) payload.country = input.country?.trim() || null;
  if (input.lat !== undefined) payload.lat = input.lat || null;
  if (input.lng !== undefined) payload.lng = input.lng || null;
  if (input.size_sqm !== undefined) payload.size_sqm = input.size_sqm || null;
  if (input.guests !== undefined) payload.guests = input.guests || null;
  if (input.bedrooms !== undefined) payload.bedrooms = input.bedrooms || null;
  if (input.beds !== undefined) payload.beds = input.beds || null;
  if (input.bathrooms !== undefined) payload.bathrooms = input.bathrooms || null;
  if (input.base_price !== undefined) payload.base_price = input.base_price || null;
  if (input.cleaning_fee !== undefined) payload.cleaning_fee = input.cleaning_fee || null;
  if (input.currency !== undefined) payload.currency = input.currency || 'EUR';
  if (input.check_in_from !== undefined) payload.check_in_from = input.check_in_from || null;
  if (input.check_out_until !== undefined) payload.check_out_until = input.check_out_until || null;
  if (input.amenities !== undefined) payload.amenities = input.amenities || {};
  if (input.status !== undefined) payload.status = input.status;

  console.log("Updating property with payload:", payload);

  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .eq("host_id", user.id) // Ensure user owns the property
    .select("*")
    .single();

  if (error) {
    console.error("Property update error:", error);
  }

  return { data, error };
}

export async function getProperty(id: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  
  if (userErr || !user) {
    const errorMsg = userErr?.message || "Utente non autenticato";
    console.error("Auth error:", userErr);
    return { data: null, error: new Error(errorMsg) };
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (error) {
    console.error("Property fetch error:", error);
  }

  return { data, error };
}

export async function getDraftProperty() {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  
  if (userErr || !user) {
    const errorMsg = userErr?.message || "Utente non autenticato";
    console.error("Auth error:", userErr);
    return { data: null, error: new Error(errorMsg) };
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("host_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Draft property fetch error:", error);
  }

  return { data, error };
}