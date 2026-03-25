import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  headerNotifications,
  notificationEventLabels,
} from "../../data/notificationsData";

export default function DashboardNotifications() {
  const [searchParams] = useSearchParams();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const sectionRef = useRef(null);
  const unreadCount = headerNotifications.filter((item) => !item.read).length;
  const selectedNotificationId = searchParams.get("notification");
  const initialNotification = useMemo(
    () =>
      headerNotifications.find((item) => item.id === selectedNotificationId) ?? null,
    [selectedNotificationId]
  );

  useEffect(() => {
    if (!initialNotification) {
      return;
    }

    setSelectedNotification(initialNotification);
  }, [initialNotification]);

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
          {headerNotifications.map((notification) => (
            <button
              className={`panel-control-notification-item panel-control-notification-item--${notification.severity}`}
              key={notification.id}
              onClick={() => setSelectedNotification(notification)}
              type="button"
            >
              <div className="panel-control-notification-top">
                <span
                  className={`panel-control-notification-event panel-control-notification-event--${notification.severity}`}
                >
                  {notificationEventLabels[notification.event] ?? notification.event}
                </span>
                <span className="panel-control-notification-time">{notification.time}</span>
              </div>

              <strong>{notification.title}</strong>
              <p>{notification.text}</p>

              <div className="panel-control-notification-bottom">
                <span
                  className={
                    notification.read
                      ? "panel-control-notification-status panel-control-notification-status--read"
                      : "panel-control-notification-status panel-control-notification-status--unread"
                  }
                >
                  {notification.read ? "Leida" : "No leida"}
                </span>
              </div>
            </button>
          ))}
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
              className={`panel-control-notification-modal-head panel-control-notification-modal-head--${selectedNotification.severity}`}
            >
              <div>
                <span
                  className={`panel-control-notification-event panel-control-notification-event--${selectedNotification.severity}`}
                >
                  {notificationEventLabels[selectedNotification.event] ?? selectedNotification.event}
                </span>
                <h4 id="panel-control-notification-modal-title">{selectedNotification.title}</h4>
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
              <p>{selectedNotification.text}</p>
              <div className="panel-control-notification-modal-details">
                <div className="panel-control-notification-modal-detail">
                  <span>Agencia</span>
                  <strong>{selectedNotification.agency}</strong>
                </div>
                <div className="panel-control-notification-modal-detail">
                  <span>Fecha</span>
                  <strong>{selectedNotification.date}</strong>
                </div>
                <div className="panel-control-notification-modal-detail">
                  <span>Ciudad</span>
                  <strong>{selectedNotification.city}</strong>
                </div>
                <div className="panel-control-notification-modal-detail">
                  <span>Motivo</span>
                  <strong>{selectedNotification.reason}</strong>
                </div>
              </div>
              <span className="panel-control-notification-modal-time">
                {selectedNotification.time}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
