import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  headerNotifications,
  notificationEventLabels,
} from "../../data/notificationsData";

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
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationsRef = useRef(null);
  const unreadCount = headerNotifications.filter((item) => !item.read).length;

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
              {headerNotifications.map((notification) => (
                <button
                  className={`header-notifications-item header-notifications-item--${notification.severity}`}
                  key={notification.id}
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedNotification(notification);
                  }}
                  type="button"
                >
                  <div className="header-notifications-meta">
                    <span
                      className={`header-notifications-event header-notifications-event--${notification.severity}`}
                    >
                      {notificationEventLabels[notification.event] ?? notification.event}
                    </span>
                  </div>
                  <strong>{notification.title}</strong>
                  <p>{notification.text}</p>
                  <span>{notification.time}</span>
                </button>
              ))}
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
                  className={`panel-control-notification-modal-head panel-control-notification-modal-head--${selectedNotification.severity}`}
                >
                  <div>
                    <span
                      className={`panel-control-notification-event panel-control-notification-event--${selectedNotification.severity}`}
                    >
                      {notificationEventLabels[selectedNotification.event] ?? selectedNotification.event}
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
            </div>,
            document.body
          )
        : null}
    </>
  );
}
