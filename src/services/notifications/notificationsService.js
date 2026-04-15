import { supabase } from "../../lib/supabase/client.js";

const NOTIFICATION_READ_EVENT = "lds:notification-read";

async function requireAuthenticatedUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesion activa en Supabase.");
  }

  return user;
}

export async function fetchMyNotifications() {
  await requireAuthenticatedUser();

  const { data, error } = await supabase.rpc("get_my_notifications", {
    notification_limit: 50,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function markNotificationAsReadInSupabase(notificationId) {
  const readAt = new Date().toISOString();
  const { error } = await supabase.rpc("mark_my_notification_as_read", {
    target_notification_id: notificationId,
  });

  if (error) {
    throw error;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_READ_EVENT, {
        detail: {
          notificationId,
          readAt,
        },
      })
    );
  }

  return { notificationId, readAt };
}

export function subscribeToNotificationRead(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    handler(event.detail);
  };

  window.addEventListener(NOTIFICATION_READ_EVENT, listener);

  return () => {
    window.removeEventListener(NOTIFICATION_READ_EVENT, listener);
  };
}
