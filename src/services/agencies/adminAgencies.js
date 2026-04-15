import { supabase } from "../../lib/supabase/client.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildAgencyDisplayName(agency) {
  return normalizeText(agency?.nombre) || "Agencia sin nombre";
}

function mapAgencyRow(row) {
  return {
    city: normalizeText(row?.ciudad),
    contactEmail: normalizeText(row?.email_empresa),
    contactPhone: normalizeText(row?.telefono_contacto),
    createdAt: row?.created_at || "",
    id: normalizeText(row?.id),
    legalRepresentativeCargo: normalizeText(row?.legal_representative?.cargo),
    legalRepresentativeEmail: normalizeText(row?.legal_representative?.email),
    legalRepresentativeName: normalizeText(row?.legal_representative?.nombre),
    name: buildAgencyDisplayName(row),
    nit: normalizeText(row?.nit),
    schedule: normalizeText(row?.horario_atencion),
    status: normalizeText(row?.status) || "inactive",
    type: normalizeText(row?.agency_type) || "seller",
    tipoPersona: normalizeText(row?.tipo_persona) || "juridica",
  };
}

function validateAgencyPayload(payload) {
  const name = normalizeText(payload?.name);
  const nit = normalizeText(payload?.nit);
  const type = normalizeText(payload?.type) || "seller";
  const tipoPersona = normalizeText(payload?.tipoPersona) || "juridica";
  const status = normalizeText(payload?.status) || "active";
  const legalRepresentativeName = normalizeText(payload?.legalRepresentativeName);

  if (!name) {
    throw new Error("Ingresa el nombre de la agencia.");
  }

  if (!nit) {
    throw new Error("Ingresa el NIT de la agencia.");
  }

  if (type !== "seller" && type !== "provider") {
    throw new Error("Selecciona un tipo valido para la agencia.");
  }

  if (tipoPersona !== "juridica" && tipoPersona !== "fisica") {
    throw new Error("Selecciona el tipo de persona de la agencia.");
  }

  if (status !== "active" && status !== "inactive") {
    throw new Error("Selecciona un estado valido para la agencia.");
  }

  return {
    city: normalizeText(payload?.city),
    contactEmail: normalizeText(payload?.contactEmail),
    contactPhone: normalizeText(payload?.contactPhone),
    legalRepresentativeCargo: normalizeText(payload?.legalRepresentativeCargo),
    legalRepresentativeEmail: normalizeText(payload?.legalRepresentativeEmail),
    legalRepresentativeName,
    name,
    nit,
    schedule: normalizeText(payload?.schedule),
    status,
    tipoPersona,
    type,
  };
}

function validateAgencyUpdatePayload(payload) {
  const normalizedPayload = validateAgencyPayload(payload);
  const normalizedId = normalizeText(payload?.id);

  if (!normalizedId) {
    throw new Error("No encontramos la agencia que quieres actualizar.");
  }

  return {
    ...normalizedPayload,
    id: normalizedId,
  };
}

export async function fetchAgenciesFromSupabase() {
  const { data, error } = await supabase
    .from("agencies")
    .select(`
      id,
      agency_type,
      nombre,
      nit,
      tipo_persona,
      telefono_contacto,
      email_empresa,
      horario_atencion,
      ciudad,
      status,
      created_at,
      legal_representative:agency_legal_representatives (
        nombre,
        email,
        cargo
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapAgencyRow);
}

export async function createAgencyInSupabase(payload) {
  const normalizedPayload = validateAgencyPayload(payload);

  const { data: agencyRow, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      agency_type: normalizedPayload.type,
      ciudad: normalizedPayload.city || null,
      email_empresa: normalizedPayload.contactEmail || null,
      horario_atencion: normalizedPayload.schedule || null,
      nit: normalizedPayload.nit,
      nombre: normalizedPayload.name,
      status: normalizedPayload.status,
      telefono_contacto: normalizedPayload.contactPhone || null,
      tipo_persona: normalizedPayload.tipoPersona,
    })
    .select(`
      id,
      agency_type,
      nombre,
      nit,
      tipo_persona,
      telefono_contacto,
      email_empresa,
      horario_atencion,
      ciudad,
      status,
      created_at
    `)
    .single();

  if (agencyError) {
    throw agencyError;
  }

  let legalRepresentativeRow = null;

  if (
    normalizedPayload.legalRepresentativeName ||
    normalizedPayload.legalRepresentativeEmail ||
    normalizedPayload.legalRepresentativeCargo
  ) {
    const { data, error } = await supabase
      .from("agency_legal_representatives")
      .insert({
        agency_id: agencyRow.id,
        cargo: normalizedPayload.legalRepresentativeCargo || null,
        email: normalizedPayload.legalRepresentativeEmail || null,
        nombre:
          normalizedPayload.legalRepresentativeName ||
          "Representante legal por definir",
      })
      .select("nombre, email, cargo")
      .single();

    if (error) {
      throw error;
    }

    legalRepresentativeRow = data;
  }

  return mapAgencyRow({
    ...agencyRow,
    legal_representative: legalRepresentativeRow,
  });
}

export async function updateAgencyInSupabase(payload) {
  const normalizedPayload = validateAgencyUpdatePayload(payload);

  const { data: agencyRow, error: agencyError } = await supabase
    .from("agencies")
    .update({
      agency_type: normalizedPayload.type,
      ciudad: normalizedPayload.city || null,
      email_empresa: normalizedPayload.contactEmail || null,
      horario_atencion: normalizedPayload.schedule || null,
      nit: normalizedPayload.nit,
      nombre: normalizedPayload.name,
      status: normalizedPayload.status,
      telefono_contacto: normalizedPayload.contactPhone || null,
      tipo_persona: normalizedPayload.tipoPersona,
    })
    .eq("id", normalizedPayload.id)
    .select(`
      id,
      agency_type,
      nombre,
      nit,
      tipo_persona,
      telefono_contacto,
      email_empresa,
      horario_atencion,
      ciudad,
      status,
      created_at
    `)
    .single();

  if (agencyError) {
    throw agencyError;
  }

  let legalRepresentativeRow = null;

  if (
    normalizedPayload.legalRepresentativeName ||
    normalizedPayload.legalRepresentativeEmail ||
    normalizedPayload.legalRepresentativeCargo
  ) {
    const representativePayload = {
      agency_id: normalizedPayload.id,
      cargo: normalizedPayload.legalRepresentativeCargo || null,
      email: normalizedPayload.legalRepresentativeEmail || null,
      nombre:
        normalizedPayload.legalRepresentativeName ||
        "Representante legal por definir",
    };

    const { data, error } = await supabase
      .from("agency_legal_representatives")
      .upsert(representativePayload, { onConflict: "agency_id" })
      .select("nombre, email, cargo")
      .single();

    if (error) {
      throw error;
    }

    legalRepresentativeRow = data;
  } else {
    const { data } = await supabase
      .from("agency_legal_representatives")
      .select("nombre, email, cargo")
      .eq("agency_id", normalizedPayload.id)
      .maybeSingle();

    legalRepresentativeRow = data ?? null;
  }

  return mapAgencyRow({
    ...agencyRow,
    legal_representative: legalRepresentativeRow,
  });
}
