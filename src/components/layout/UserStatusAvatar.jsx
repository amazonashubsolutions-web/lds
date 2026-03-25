import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6"></path>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="2"></rect>
      <rect x="13" y="3" width="8" height="5" rx="2"></rect>
      <rect x="13" y="10" width="8" height="11" rx="2"></rect>
      <rect x="3" y="13" width="8" height="8" rx="2"></rect>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <path d="M16 17l5-5-5-5"></path>
      <path d="M21 12H9"></path>
    </svg>
  );
}

export default function UserStatusAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="header-user-menu" ref={menuRef}>
      <button
        className={
          isOpen
            ? "header-user-menu-trigger header-user-menu-trigger--open"
            : "header-user-menu-trigger"
        }
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="header-user-status" aria-hidden="true">
          <img
            src="/images/user/hermano juanpa.jpg"
            alt=""
            className="header-user-status-image"
          />
          <span className="header-user-status-dot" aria-hidden="true"></span>
        </div>

        <div className="header-user-copy">
          <strong>Pedro</strong>
        </div>

        <span className="header-user-chevron" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen ? (
        <div className="header-user-dropdown">
          <Link
            className="header-user-dropdown-item"
            to="/panel-de-control"
            onClick={() => setIsOpen(false)}
          >
            <span className="header-user-dropdown-icon" aria-hidden="true">
              <DashboardIcon />
            </span>
            <span>Panel de Control</span>
          </Link>
          <div
            className="header-user-dropdown-divider"
            aria-hidden="true"
          ></div>
          <button
            className="header-user-dropdown-item header-user-dropdown-item--danger"
            type="button"
          >
            <span className="header-user-dropdown-icon" aria-hidden="true">
              <LogoutIcon />
            </span>
            <span>Salir</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
