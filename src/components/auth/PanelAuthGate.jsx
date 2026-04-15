import { Outlet } from "react-router-dom";

import LoadingState from "../common/LoadingState";
import { usePanelSession } from "../../contexts/PanelSessionContext";
import PanelLoginScreen from "./PanelLoginScreen";

function PanelAccessState({ eyebrow, title, body, isLoading = false }) {
  return (
    <div className="panel-auth-shell">
      <div className="panel-auth-card panel-auth-card--state">
        <div className="panel-auth-copy">
          <p>{eyebrow}</p>
          {isLoading ? (
            <LoadingState
              className="panel-auth-loading-state"
              title={title}
              description={body}
            />
          ) : (
            <>
              <h1>{title}</h1>
              <span>{body}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PanelAuthGate() {
  const {
    isAuthenticated,
    isProfileLoading,
    isSessionLoading,
    profile,
  } = usePanelSession();

  if (isSessionLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <PanelAccessState
        eyebrow="Conectando panel"
        title="Estamos validando tu sesion"
        body="En unos segundos habilitamos el panel con tu usuario autenticado."
        isLoading
      />
    );
  }

  if (!isAuthenticated) {
    return <PanelLoginScreen />;
  }

  if (!profile) {
    return (
      <PanelAccessState
        eyebrow="Perfil no disponible"
        title="La sesion existe, pero el perfil del panel no se pudo cargar"
        body="Verifica que el usuario autenticado tambien exista en public.users y vuelve a intentar."
      />
    );
  }

  return <Outlet />;
}
