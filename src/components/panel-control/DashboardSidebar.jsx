import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import LoadingSpinner from "../common/LoadingSpinner";
import { updateCurrentPanelUserPhotoInSupabase } from "../../services/users/adminUsers";
import { usePanelSession } from "../../contexts/PanelSessionContext";
import {
  DEFAULT_USER_PHOTO_FILENAME,
  resolveUserPhotoUrl,
} from "../../utils/userPhotos";

function MenuIcon({ type }) {
  if (type === "card") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="3"></rect>
        <path d="M2 10h20"></path>
      </svg>
    );
  }

  if (type === "bookmark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"></path>
      </svg>
    );
  }

  if (type === "support") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 13a8 8 0 0 1 16 0"></path>
        <path d="M18 16a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2"></path>
        <path d="M6 16a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2"></path>
        <path d="M12 19v2"></path>
      </svg>
    );
  }

  if (type === "ticket") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z"></path>
        <path d="M12 5v14"></path>
      </svg>
    );
  }

  if (type === "package") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8.5 12 13l9-4.5"></path>
        <path d="M12 13v8"></path>
        <path d="M20 16V8l-8-4-8 4v8l8 4 8-4Z"></path>
      </svg>
    );
  }

  if (type === "building") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18"></path>
        <path d="M5 21V7l7-4 7 4v14"></path>
        <path d="M9 10h.01"></path>
        <path d="M15 10h.01"></path>
        <path d="M9 14h.01"></path>
        <path d="M15 14h.01"></path>
        <path d="M10 21v-3h4v3"></path>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 1 0-16 0"></path>
      <circle cx="12" cy="8" r="4"></circle>
    </svg>
  );
}

export default function DashboardSidebar({ profile, menu }) {
  const location = useLocation();
  const { displayName, profile: sessionProfile, refreshProfile, roleLabel } =
    usePanelSession();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoFilename, setSelectedPhotoFilename] = useState(
    DEFAULT_USER_PHOTO_FILENAME,
  );
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = useState("");
  const [photoUpdateError, setPhotoUpdateError] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const currentAgencyType = sessionProfile?.agency?.agency_type || "";
  const visibleMenu = menu.filter((item) => {
    if (item.id === "productos") {
      if (sessionProfile?.role === "super_user") {
        return true;
      }

      return currentAgencyType === "provider";
    }

    if (!Array.isArray(item?.allowedRoles) || item.allowedRoles.length === 0) {
      return true;
    }

    return item.allowedRoles.includes(sessionProfile?.role);
  });
  const resolvedProfile = sessionProfile
    ? {
        name: displayName,
        level: roleLabel,
        avatar: resolveUserPhotoUrl(sessionProfile.photo_url),
        summaryLabel: "Sesion activa",
        summaryValue: sessionProfile.email,
      }
    : {
        ...profile,
        summaryLabel: "Puntos acumulados",
        summaryValue: profile.points,
    };

  useEffect(() => {
    setSelectedPhotoFilename(
      sessionProfile?.photo_url || DEFAULT_USER_PHOTO_FILENAME,
    );
  }, [sessionProfile?.photo_url]);

  useEffect(() => {
    return () => {
      if (selectedPhotoPreviewUrl) {
        URL.revokeObjectURL(selectedPhotoPreviewUrl);
      }
    };
  }, [selectedPhotoPreviewUrl]);

  function openPhotoModal() {
    setPhotoUpdateError("");
    setSelectedPhotoFilename(
      sessionProfile?.photo_url || DEFAULT_USER_PHOTO_FILENAME,
    );
    setSelectedPhotoPreviewUrl("");
    setIsPhotoModalOpen(true);
  }

  function closePhotoModal() {
    if (isSavingPhoto) {
      return;
    }

    if (selectedPhotoPreviewUrl) {
      URL.revokeObjectURL(selectedPhotoPreviewUrl);
    }

    setSelectedPhotoPreviewUrl("");
    setIsPhotoModalOpen(false);
  }

  function handlePhotoFileChange(event) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (selectedPhotoPreviewUrl) {
      URL.revokeObjectURL(selectedPhotoPreviewUrl);
    }

    setPhotoUpdateError("");
    setSelectedPhotoFilename(nextFile.name || DEFAULT_USER_PHOTO_FILENAME);
    setSelectedPhotoPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function handleSavePhoto() {
    try {
      setIsSavingPhoto(true);
      setPhotoUpdateError("");
      await updateCurrentPanelUserPhotoInSupabase(
        sessionProfile?.id,
        selectedPhotoFilename,
      );
      await refreshProfile();
      setIsPhotoModalOpen(false);
    } catch (error) {
      setPhotoUpdateError(
        error?.message ||
          "No fue posible actualizar la foto de perfil. Intenta de nuevo.",
      );
    } finally {
      setIsSavingPhoto(false);
    }
  }

  return (
    <aside className="panel-control-sidebar">
      <div className="panel-control-profile-card">
        <div className="panel-control-profile-avatar">
          <img alt={resolvedProfile.name} src={resolvedProfile.avatar} />
          {sessionProfile ? (
            <button
              type="button"
              className="panel-control-profile-avatar-action"
              onClick={openPhotoModal}
              aria-label="Cambiar foto de perfil"
              title="Cambiar foto"
            >
              <span className="material-icons-outlined" aria-hidden="true">
                photo_camera
              </span>
            </button>
          ) : null}
        </div>
        <h2>{resolvedProfile.name}</h2>
        <p>{resolvedProfile.level}</p>

        <div className="panel-control-points-card">
          <span>{resolvedProfile.summaryLabel}</span>
          <strong>{resolvedProfile.summaryValue}</strong>
        </div>

      </div>

      <nav className="panel-control-nav-card">
        <h3>Cuenta</h3>
        <div className="panel-control-nav-list">
          {visibleMenu.map((item) => {
            const isActive = item.path
              ? location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`)
              : Boolean(item.active);

            if (item.path) {
              return (
                <NavLink
                  className={
                    isActive
                      ? "panel-control-nav-item panel-control-nav-item--active"
                      : "panel-control-nav-item"
                  }
                  key={item.id}
                  to={item.path}
                >
                  <span className="panel-control-nav-icon" aria-hidden="true">
                    <MenuIcon type={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            }

            return (
              <button className="panel-control-nav-item" key={item.id} type="button">
                <span className="panel-control-nav-icon" aria-hidden="true">
                  <MenuIcon type={item.icon} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {isPhotoModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closePhotoModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal panel-control-profile-photo-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-sidebar-photo-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closePhotoModal}
              aria-label="Cerrar selector de foto"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Foto de perfil</p>
            <h3 id="panel-control-sidebar-photo-title">
              Elige la foto que quieres usar en el panel
            </h3>

            <div className="panel-control-profile-photo-picker">
              <img
                src={
                  selectedPhotoPreviewUrl ||
                  resolveUserPhotoUrl(selectedPhotoFilename)
                }
                alt="Vista previa de foto de perfil"
                className="panel-control-profile-photo-preview"
              />

              <label className="panel-control-users-field panel-control-users-field--full">
                <span>Selecciona la foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  disabled={isSavingPhoto}
                />
                <small className="panel-control-profile-photo-note">
                  Elige una imagen desde
                  {" "}
                  <strong>public/images/user</strong>
                  {" "}
                  y LDS guardara solo el filename en Supabase.
                </small>
                <small className="panel-control-profile-photo-note">
                  Archivo actual:
                  {" "}
                  <strong>{selectedPhotoFilename || DEFAULT_USER_PHOTO_FILENAME}</strong>
                </small>
              </label>
            </div>

            {photoUpdateError ? (
              <p className="panel-control-users-feedback panel-control-users-feedback--error">
                {photoUpdateError}
              </p>
            ) : null}

            <div className="detalle-producto-admin-modal-actions">
              <button
                type="button"
                className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                onClick={closePhotoModal}
                disabled={isSavingPhoto}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="detalle-producto-admin-modal-button"
                onClick={handleSavePhoto}
                disabled={isSavingPhoto}
              >
                <span className="lds-button-content">
                  {isSavingPhoto ? (
                    <LoadingSpinner label="Guardando foto" size="sm" />
                  ) : (
                    <span className="material-icons-outlined" aria-hidden="true">
                      photo_camera
                    </span>
                  )}
                  <span>{isSavingPhoto ? "Guardando..." : "Guardar foto"}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
