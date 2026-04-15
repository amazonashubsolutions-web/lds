import { createClient } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase/client.js";
import {
  DEFAULT_USER_PHOTO_FILENAME,
  normalizeUserPhotoFilename,
  resolveUserPhotoUrl,
} from "../../utils/userPhotos.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function createProvisioningClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
        storageKey: "lds-panel-user-provisioner",
      },
    },
  );
}

async function confirmPanelUserEmailInSupabase(userId) {
  const normalizedUserId = normalizeText(userId);

  if (!normalizedUserId) {
    throw new Error("No encontramos el identificador del usuario que se acaba de crear.");
  }

  const { error } = await supabase.rpc("confirm_panel_user_email_dev", {
    target_user_id: normalizedUserId,
  });

  if (error) {
    throw error;
  }
}

function validatePanelUserPayload(payload) {
  const normalizedRole = normalizeText(payload?.role) || "travel_agent";
  const normalizedAgencyId = normalizeText(payload?.agencyId);
  const normalizedEmail = normalizeText(payload?.email).toLowerCase();
  const normalizedPassword = String(payload?.password ?? "");
  const normalizedFirstName = normalizeText(payload?.firstName);
  const normalizedLastName = normalizeText(payload?.lastName);
  const normalizedStatus = normalizeText(payload?.status) || "active";
  const normalizedPhotoFilename = normalizeUserPhotoFilename(
    payload?.photoFilename,
  );

  if (!normalizedFirstName) {
    throw new Error("Ingresa el nombre del usuario.");
  }

  if (!normalizedLastName) {
    throw new Error("Ingresa el apellido del usuario.");
  }

  if (!normalizedEmail) {
    throw new Error("Ingresa el correo del usuario.");
  }

  if (!normalizedPassword || normalizedPassword.length < 8) {
    throw new Error("La clave temporal debe tener al menos 8 caracteres.");
  }

  if (
    normalizedRole !== "super_user" &&
    normalizedRole !== "agency_admin" &&
    normalizedRole !== "travel_agent"
  ) {
    throw new Error("Selecciona un rol valido para el nuevo usuario.");
  }

  if (
    normalizedStatus !== "active" &&
    normalizedStatus !== "inactive"
  ) {
    throw new Error("Selecciona un estado valido para el usuario.");
  }

  if (normalizedRole !== "super_user" && !normalizedAgencyId) {
    throw new Error("Selecciona la agencia a la que pertenece el usuario.");
  }

  return {
    agencyId: normalizedRole === "super_user" ? null : normalizedAgencyId,
    email: normalizedEmail,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    password: normalizedPassword,
    photoFilename: normalizedPhotoFilename || DEFAULT_USER_PHOTO_FILENAME,
    phone: normalizeText(payload?.phone),
    role: normalizedRole,
    status: normalizedStatus,
  };
}

function validatePanelUserUpdatePayload(payload) {
  const normalizedRole = normalizeText(payload?.role) || "travel_agent";
  const normalizedStatus = normalizeText(payload?.status) || "active";
  const normalizedFirstName = normalizeText(payload?.firstName);
  const normalizedLastName = normalizeText(payload?.lastName);
  const normalizedAgencyId = normalizeText(payload?.agencyId);
  const normalizedPhotoFilename = normalizeUserPhotoFilename(
    payload?.photoFilename,
  );

  if (!normalizeText(payload?.id)) {
    throw new Error("No encontramos el usuario que quieres actualizar.");
  }

  if (!normalizedFirstName) {
    throw new Error("Ingresa el nombre del usuario.");
  }

  if (!normalizedLastName) {
    throw new Error("Ingresa el apellido del usuario.");
  }

  if (
    normalizedRole !== "super_user" &&
    normalizedRole !== "agency_admin" &&
    normalizedRole !== "travel_agent"
  ) {
    throw new Error("Selecciona un rol valido para el usuario.");
  }

  if (normalizedStatus !== "active" && normalizedStatus !== "inactive") {
    throw new Error("Selecciona un estado valido para el usuario.");
  }

  if (normalizedRole !== "super_user" && !normalizedAgencyId) {
    throw new Error("Selecciona la agencia a la que pertenece el usuario.");
  }

  return {
    agencyId: normalizedRole === "super_user" ? null : normalizedAgencyId,
    firstName: normalizedFirstName,
    id: normalizeText(payload?.id),
    lastName: normalizedLastName,
    photoFilename: normalizedPhotoFilename || DEFAULT_USER_PHOTO_FILENAME,
    phone: normalizeText(payload?.phone),
    role: normalizedRole,
    status: normalizedStatus,
  };
}

function mapUserRow(row) {
  const normalizedRole = normalizeText(row?.role) || "travel_agent";
  const isPlatformSuperUser = normalizedRole === "super_user";

  return {
    agencyId: isPlatformSuperUser ? "" : normalizeText(row?.agency_id),
    agencyName: isPlatformSuperUser
      ? "LDS Plataforma"
      : normalizeText(row?.agency?.nombre) || "Sin agencia",
    agencyType: isPlatformSuperUser
      ? "platform"
      : normalizeText(row?.agency?.agency_type) || "",
    createdAt: row?.created_at || "",
    email: normalizeText(row?.email),
    firstName: normalizeText(row?.first_name),
    fullName:
      [normalizeText(row?.first_name), normalizeText(row?.last_name)]
        .filter(Boolean)
        .join(" ") || normalizeText(row?.email) || "Usuario LDS",
    id: normalizeText(row?.id),
    lastName: normalizeText(row?.last_name),
    phone: normalizeText(row?.phone),
    photoFilename:
      normalizeUserPhotoFilename(row?.photo_url) || DEFAULT_USER_PHOTO_FILENAME,
    photoUrl: resolveUserPhotoUrl(row?.photo_url),
    role: normalizedRole,
    status: normalizeText(row?.status) || "inactive",
  };
}

export async function fetchAgencyOptionsFromSupabase() {
  const { data, error } = await supabase
    .from("agencies")
    .select("id, nombre, agency_type, ciudad, status")
    .order("nombre", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((agency) => ({
    city: normalizeText(agency?.ciudad),
    id: normalizeText(agency?.id),
    name: normalizeText(agency?.nombre) || "Agencia sin nombre",
    status: normalizeText(agency?.status) || "inactive",
    type: normalizeText(agency?.agency_type) || "seller",
  }));
}

export async function fetchPanelUsersFromSupabase() {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      agency_id,
      role,
      first_name,
      last_name,
      email,
      phone,
      photo_url,
      status,
      created_at,
      agency:agencies (
        id,
        nombre,
        agency_type
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapUserRow);
}

export async function createPanelUserInSupabase(payload) {
  const normalizedPayload = validatePanelUserPayload(payload);
  const provisioningClient = createProvisioningClient();

  try {
    const { data: authData, error: authError } = await provisioningClient.auth.signUp({
      email: normalizedPayload.email,
      password: normalizedPayload.password,
      options: {
        data: {
          agency_id: normalizedPayload.agencyId,
          first_name: normalizedPayload.firstName,
          last_name: normalizedPayload.lastName,
          role: normalizedPayload.role,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    const createdUserId = normalizeText(authData?.user?.id);

    if (!createdUserId) {
      throw new Error(
        "Supabase no devolvio el identificador del usuario creado. Intenta de nuevo.",
      );
    }

    const updatePayload = {
      agency_id: normalizedPayload.agencyId,
      first_name: normalizedPayload.firstName,
      last_name: normalizedPayload.lastName,
      phone: normalizedPayload.phone || null,
      photo_url: normalizedPayload.photoFilename,
      role: normalizedPayload.role,
      status: normalizedPayload.status,
    };

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", createdUserId)
      .select(`
        id,
        agency_id,
        role,
        first_name,
        last_name,
        email,
        phone,
        photo_url,
        status,
        created_at,
        agency:agencies (
          id,
          nombre,
          agency_type
        )
      `)
      .single();

    if (userError) {
      throw userError;
    }

    await confirmPanelUserEmailInSupabase(createdUserId);

    const normalizedUserRow = mapUserRow({
      ...userRow,
      email_verified_at: new Date().toISOString(),
    });

    return {
      ...normalizedUserRow,
      shouldConfirmEmail: false,
    };
  } finally {
    provisioningClient.auth.signOut().catch(() => {});
  }
}

export async function updatePanelUserInSupabase(payload) {
  const normalizedPayload = validatePanelUserUpdatePayload(payload);

  const { data, error } = await supabase
    .from("users")
    .update({
      agency_id: normalizedPayload.agencyId,
      first_name: normalizedPayload.firstName,
      last_name: normalizedPayload.lastName,
      phone: normalizedPayload.phone || null,
      photo_url: normalizedPayload.photoFilename,
      role: normalizedPayload.role,
      status: normalizedPayload.status,
    })
    .eq("id", normalizedPayload.id)
    .select(`
      id,
      agency_id,
      role,
      first_name,
      last_name,
      email,
      phone,
      photo_url,
      status,
      created_at,
      agency:agencies (
        id,
        nombre,
        agency_type
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return mapUserRow(data);
}

export async function updateCurrentPanelUserPhotoInSupabase(userId, photoFilename) {
  const normalizedUserId = normalizeText(userId);
  const normalizedPhoto =
    normalizeUserPhotoFilename(photoFilename) || DEFAULT_USER_PHOTO_FILENAME;

  if (!normalizedUserId) {
    throw new Error("No encontramos el usuario autenticado para actualizar la foto.");
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      photo_url: normalizedPhoto,
    })
    .eq("id", normalizedUserId)
    .select(`
      id,
      agency_id,
      role,
      first_name,
      last_name,
      email,
      phone,
      photo_url,
      status,
      created_at,
      agency:agencies (
        id,
        nombre,
        agency_type
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return mapUserRow(data);
}
