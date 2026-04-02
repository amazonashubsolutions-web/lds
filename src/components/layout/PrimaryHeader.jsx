import { Link } from "react-router-dom";
import UserStatusAvatar from "./UserStatusAvatar";
import HeaderNotifications from "./HeaderNotifications";

export default function PrimaryHeader({ links = [] }) {
  return (
    <header className="primary-header">
      <nav className="primary-nav">
        <Link className="primary-logo-link" to="/buscador" aria-label="LDS home">
          <img
            src="/images/Logo/logo-lds-blanco.png"
            alt="LDS"
            className="primary-logo-image"
          />
        </Link>

        {links.length > 0 ? (
          <div className="primary-links">
            {links.map((link, index) => (
              <a
                key={link.label}
                className={
                  index === 0 ? "primary-link primary-link--active" : "primary-link"
                }
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}

        <div className="primary-actions">
          <UserStatusAvatar />
          <HeaderNotifications />
        </div>
      </nav>
    </header>
  );
}
