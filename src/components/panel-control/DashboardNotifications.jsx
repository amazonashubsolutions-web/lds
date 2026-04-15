import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

export default function DashboardNotifications() {
  const [searchParams] = useSearchParams();
  const selectedNotificationId = searchParams.get("notification");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const sectionRef = useRef(null);
  
  useEffect(() => {
    let isMounted = true;
    fetchMyNotifications()
      .then((data) => {
        if (isMounted) {
          setNotifications(data || []);
          if (selectedNotificationId) {
            const found = data.find(n => n.id === selectedNotificationId);
            if (found) setSelectedNotification(found);
          }
        }
      })
      .catch((error) => console.error("Error cargando notificaciones de panel:", error));
      
    return () => {
      isMounted = false;
    };
  }, [selectedNotificationId]);

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

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const handleOpenNotification = async (notification) => {
    setSelectedNotification(notification);

    if (!notification.read_at) {
      try {
        await markNotificationAsReadInSupabase(notification.id);
      } catch (err) {
        console.error("Error marcando notificacion como leida en panel:", err);
      }
    }
  };

  useEffect(() => {
    if (!selectedNotificationId) {
      return;
    }

    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedNotificationId]);

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
      <section
        className="panel-control-card panel-control-notifications-card"
        id="panel-control-notifications"
        ref={sectionRef}
      >
        <div className="panel-control-card-head">
          <div className="panel-control-title-with-badge">
            <h3>Notificaciones</h3>
            {unreadCount > 0 ? (
              <span className="panel-control-inline-badge">{unreadCount}</span>
            ) : null}
          </div>
          <button type="button">Ver todas</button>
        </div>

        <div className="panel-control-notifications-list">
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              No tienes notificaciones en este panel
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                className={`panel-control-notification-item panel-control-notification-item--${notification.severity || "low"}`}
                key={notification.id}
                onClick={() => handleOpenNotification(notification)}
                type="button"
              >
                <div className="panel-control-notification-top">
                  <span
                    className={`panel-control-notification-event panel-control-notification-event--${notification.severity || "low"}`}
                  >
                    {notificationEventLabels[notification.type] ?? notification.type}
                  </span>
                  <span className="panel-control-notification-time">{getRelativeTime(notification.created_at)}</span>
                </div>

                <strong>{notification.title}</strong>
                <p>{notification.body}</p>

                <div className="panel-control-notification-bottom">
                  <span
                    className={
                      notification.read_at
                        ? "panel-control-notification-status panel-control-notification-status--read"
                        : "panel-control-notification-status panel-control-notification-status--unread"
                    }
                  >
                    {notification.read_at ? "Leida" : "No leida"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {selectedNotification ? (
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
            aria-labelledby="panel-control-notification-modal-title"
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
                <h4 id="panel-control-notification-modal-title">{selectedNotification.title}</h4>
              </div>
              <button
                className="panel-control-notification-modal-close"
                onClick={() => setSelectedNotification(null)}
                type="button"
              >
                x
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
                  <strong>{selectedNotification.reason || "Sin observaciones."}</strong>
                </div>
              </div>
              <span className="panel-control-notification-modal-time" style={{ display: "block", marginTop: "1rem", color: "#64748b", fontSize: "0.85rem" }}>
                Enviada {getRelativeTime(selectedNotification.created_at)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
