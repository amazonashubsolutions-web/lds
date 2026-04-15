import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabase/client.js";

const PanelSessionContext = createContext(null);
const PANEL_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const PANEL_SESSION_STORAGE_KEY = "lds:panel-session-meta";
const PANEL_SESSION_TIMEOUT_MESSAGE =
  "Tu sesion expiro automaticamente despues de 30 minutos. Inicia sesion de nuevo para continuar.";

function readStoredPanelSessionMeta() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(PANEL_SESSION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (
      typeof parsedValue?.userId !== "string" ||
      typeof parsedValue?.startedAt !== "number" ||
      !Number.isFinite(parsedValue.startedAt)
    ) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

function writeStoredPanelSessionMeta(userId, startedAt) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PANEL_SESSION_STORAGE_KEY,
    JSON.stringify({ userId, startedAt })
  );
}

function clearStoredPanelSessionMeta() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PANEL_SESSION_STORAGE_KEY);
}

function resolvePanelSessionStartedAt(nextSession, { reset = false } = {}) {
  if (!nextSession?.user?.id) {
    return null;
  }

  const storedMeta = readStoredPanelSessionMeta();

  if (!reset && storedMeta?.userId === nextSession.user.id) {
    return storedMeta.startedAt;
  }

  const startedAt = Date.now();
  writeStoredPanelSessionMeta(nextSession.user.id, startedAt);
  return startedAt;
}

function getDisplayName(profile) {
  const fullName = [profile?.first_name, profile?.last_name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return fullName || profile?.email || "Usuario LDS";
}

function getRoleLabel(role) {
  if (role === "super_user") {
    return "Super User";
  }

  if (role === "agency_admin") {
    return "Agency Admin";
  }

  return "Travel Agent";
}

export function PanelSessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const sessionTimeoutRef = useRef(null);
  const pendingSignedOutMessageRef = useRef("");

  const clearSessionTimeout = useCallback(() => {
    if (typeof window === "undefined" || sessionTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(sessionTimeoutRef.current);
    sessionTimeoutRef.current = null;
  }, []);

  const scheduleSessionTimeout = useCallback(
    async (nextSession, { resetStartedAt = false } = {}) => {
      clearSessionTimeout();

      if (!nextSession?.user?.id || typeof window === "undefined") {
        return false;
      }

      const startedAt = resolvePanelSessionStartedAt(nextSession, {
        reset: resetStartedAt,
      });
      const remainingMs = PANEL_SESSION_TIMEOUT_MS - (Date.now() - startedAt);

      if (remainingMs <= 0) {
        pendingSignedOutMessageRef.current = PANEL_SESSION_TIMEOUT_MESSAGE;
        clearStoredPanelSessionMeta();

        const { error } = await supabase.auth.signOut();

        if (error) {
          pendingSignedOutMessageRef.current = "";
          setAuthError(
            error.message || "No fue posible cerrar la sesion automaticamente."
          );
        }

        return true;
      }

      sessionTimeoutRef.current = window.setTimeout(async () => {
        pendingSignedOutMessageRef.current = PANEL_SESSION_TIMEOUT_MESSAGE;
        clearStoredPanelSessionMeta();

        const { error } = await supabase.auth.signOut();

        if (error) {
          pendingSignedOutMessageRef.current = "";
          setAuthError(
            error.message || "No fue posible cerrar la sesion automaticamente."
          );
        }
      }, remainingMs);

      return false;
    },
    [clearSessionTimeout]
  );

  const loadProfile = useCallback(async (nextSession) => {
    if (!nextSession?.user?.id) {
      setProfile(null);
      setIsProfileLoading(false);
      return null;
    }

    setIsProfileLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        agency_id,
        role,
        first_name,
        last_name,
        email,
        photo_url,
        status,
        agency:agencies (
          id,
          agency_type,
          nombre
        )
      `)
      .eq("id", nextSession.user.id)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setAuthError(error.message || "No pudimos cargar el perfil del panel.");
      setIsProfileLoading(false);
      throw error;
    }

    setProfile(data ?? null);
    setIsProfileLoading(false);
    return data ?? null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setAuthError(error.message || "No pudimos recuperar la sesion.");
        }

        const nextSession = data.session ?? null;
        setSession(nextSession);

        if (nextSession) {
          const isExpired = await scheduleSessionTimeout(nextSession);

          if (isExpired) {
            setIsSessionLoading(false);
            return;
          }

          try {
            await loadProfile(nextSession);
          } catch {
            // The login gate will render a friendly state if the profile cannot be loaded.
          }
        } else {
          clearSessionTimeout();
          clearStoredPanelSessionMeta();
          setProfile(null);
        }

        setIsSessionLoading(false);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setSession(null);
        clearSessionTimeout();
        clearStoredPanelSessionMeta();
        setProfile(null);
        setAuthError(error.message || "No pudimos iniciar la sesion del panel.");
        setIsSessionLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        setAuthError("");
        const isExpired = await scheduleSessionTimeout(nextSession, {
          resetStartedAt: event === "SIGNED_IN",
        });

        if (isExpired) {
          return;
        }

        loadProfile(nextSession).catch(() => {});
        return;
      }

      clearSessionTimeout();
      clearStoredPanelSessionMeta();
      setProfile(null);
      setIsProfileLoading(false);

      if (pendingSignedOutMessageRef.current) {
        setAuthError(pendingSignedOutMessageRef.current);
        pendingSignedOutMessageRef.current = "";
        return;
      }

      if (event !== "SIGNED_OUT") {
        setAuthError("");
      }
    });

    return () => {
      isMounted = false;
      clearSessionTimeout();
      subscription.unsubscribe();
    };
  }, [clearSessionTimeout, loadProfile, scheduleSessionTimeout]);

  const signInWithPassword = useCallback(async ({ email, password }) => {
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message || "No fue posible iniciar sesion.");
      throw error;
    }

    if (data.session) {
      await scheduleSessionTimeout(data.session, { resetStartedAt: true });
      await loadProfile(data.session);
    }

    return data;
  }, [loadProfile, scheduleSessionTimeout]);

  const signOut = useCallback(async ({ reason = "" } = {}) => {
    pendingSignedOutMessageRef.current = reason;
    clearSessionTimeout();
    clearStoredPanelSessionMeta();

    const { error } = await supabase.auth.signOut();

    if (error) {
      pendingSignedOutMessageRef.current = "";
      setAuthError(error.message || "No fue posible cerrar sesion.");
      throw error;
    }

    setProfile(null);
  }, [clearSessionTimeout]);

  const value = useMemo(
    () => ({
      session,
      profile,
      authError,
      isSessionLoading,
      isProfileLoading,
      isAuthenticated: Boolean(session),
      displayName: getDisplayName(profile),
      roleLabel: getRoleLabel(profile?.role),
      signInWithPassword,
      signOut,
      refreshProfile: () => loadProfile(session),
    }),
    [
      authError,
      isProfileLoading,
      isSessionLoading,
      loadProfile,
      profile,
      session,
      signInWithPassword,
      signOut,
    ],
  );

  return (
    <PanelSessionContext.Provider value={value}>
      {children}
    </PanelSessionContext.Provider>
  );
}

export function usePanelSession() {
  const context = useContext(PanelSessionContext);

  if (!context) {
    throw new Error("usePanelSession must be used within PanelSessionProvider");
  }

  return context;
}
