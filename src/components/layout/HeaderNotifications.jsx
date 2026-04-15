import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { notificationEventLabels } from "../../data/notificationsData";
import {
  fetchMyNotifications,
  markNotificationAsReadInSupabase,
  subscribeToNotificationRead,
} from "../../services/notifications/notificationsService.js";

function getRelativeTime(dateString) {
  if (!dateString) return "";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return `Hace un momento`;
  if (diffMins < 60) return `Hace ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `Hace ${diffHrs} hora${diffHrs !== 1 ? 's' : ''}`;
  const diffDays = Math.round(diffHrs / 24);
  return `Hace ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"></path>
      <path d="M10 21a2 2 0 0 0 4 0"></path>
    </svg>
  );
}

export default function HeaderNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationsRef = useRef(null);
  
  useEffect(() => {
    let isMounted = true;
    fetchMyNotifications()
      .then((data) => {
        if (isMounted) setNotifications(data || []);
      })
      .catch((error) => console.error("Error cargando notificaciones:", error));
      
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToNotificationRead(({ notificationId, readAt }) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read_at: readAt }
            : notification
        )
      );
      setSelectedNotification((current) =>
        current?.id === notificationId ? { ...current, read_at: readAt } : current
      );
    });
  }, []);

  const unreadNotifications = notifications.filter((item) => !item.read_at);
  const unreadCount = unreadNotifications.length;

  const handleOpenNotification = async (notification) => {
    setIsOpen(false);
    setSelectedNotification(notification);

    if (!notification.read_at) {
      try {
        await markNotificationAsReadInSupabase(notification.id);
      } catch (err) {
        console.error("Error marcando notificacion como leida:", err);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (notificationsRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!selectedNotification) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedNotification(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNotification]);

  return (
    <>
      <div className="header-notifications" ref={notificationsRef}>
        <button
          aria-label="Notificaciones"
          className={
            isOpen
              ? "header-notifications-trigger header-notifications-trigger--open"
              : "header-notifications-trigger"
          }
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="header-notifications-icon" aria-hidden="true">
            <BellIcon />
          </span>
          {unreadCount > 0 ? (
            <span className="header-notifications-count" aria-hidden="true">
              {unreadCount}
            </span>
          ) : null}
        </button>

        {isOpen ? (
          <div className="header-notifications-dropdown">
            <div className="header-notifications-head">
              <strong>Notificaciones</strong>
              <span>{unreadCount} nuevas</span>
            </div>

            <div className="header-notifications-list">
              {unreadNotifications.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                  No tienes notificaciones nuevas
                </div>
              ) : (
                unreadNotifications.map((notification) => (
                  <button
                    className={
                      notification.read_at
                        ? `header-notifications-item header-notifications-item--${notification.severity || "low"} header-notifications-item--read`
                        : `header-notifications-item header-notifications-item--${notification.severity || "low"} header-notifications-item--unread`
                    }
                    key={notification.id}
                    onClick={() => handleOpenNotification(notification)}
                    type="button"
                  >
                    {!notification.read_at && (
                      <span className="header-notifications-unread-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#3b82f6", borderRadius: "50%", position: "absolute", top: "16px", right: "16px" }}></span>
                    )}
                    <div className="header-notifications-meta">
                      <span
                        className={`header-notifications-event header-notifications-event--${notification.severity || "low"}`}
                      >
                        {notificationEventLabels[notification.type] ?? notification.type}
                      </span>
                      <span
                        className={
                          notification.read_at
                            ? "header-notifications-status header-notifications-status--read"
                            : "header-notifications-status header-notifications-status--unread"
                        }
                      >
                        {notification.read_at ? "Leida" : "No leida"}
                      </span>
                    </div>
                    <strong>{notification.title}</strong>
                    <p>{notification.body}</p>
                    <span>{getRelativeTime(notification.created_at)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      {selectedNotification
        ? createPortal(
            <div
              className="panel-control-notification-modal-backdrop"
              onClick={() => setSelectedNotification(null)}
              role="presentation"
            >
              <div
                className="panel-control-notification-modal"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="header-notification-modal-title"
              >
                <div
                  className={`panel-control-notification-modal-head panel-control-notification-modal-head--${selectedNotification.severity || "low"}`}
                >
                  <div>
                    <span
                      className={`panel-control-notification-event panel-control-notification-event--${selectedNotification.severity || "low"}`}
                    >
                      {notificationEventLabels[selectedNotification.type] ?? selectedNotification.type}
                    </span>
                    <h4 id="header-notification-modal-title">{selectedNotification.title}</h4>
                  </div>
                  <button
                    className="panel-control-notification-modal-close"
                    onClick={() => setSelectedNotification(null)}
                    type="button"
                  >
                    ×
                  </button>
                </div>

                <div className="panel-control-notification-modal-body">
                  <p>{selectedNotification.body}</p>
                  <div className="panel-control-notification-modal-details">
                    <div className="panel-control-notification-modal-detail">
                      <span>Agencia</span>
                      <strong>{selectedNotification.agency_name || "-"}</strong>
                    </div>
                    <div className="panel-control-notification-modal-detail">
                      <span>Fecha viaje</span>
                      <strong>{selectedNotification.travel_date_string || "-"}</strong>
                    </div>
                    <div className="panel-control-notification-modal-detail">
                      <span>Ciudad</span>
                      <strong>{selectedNotification.city_name || "-"}</strong>
                    </div>
                    <div className="panel-control-notification-modal-detail">
                      <span>Motivo</span>
                      <strong>{selectedNotification.reason || "Sin observaciones registradas."}</strong>
                    </div>
                  </div>
                  <span className="panel-control-notification-modal-time" style={{ display: "block", marginTop: "1rem", color: "#64748b", fontSize: "0.85rem" }}>
                    Enviada {getRelativeTime(selectedNotification.created_at)}
                  </span>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
