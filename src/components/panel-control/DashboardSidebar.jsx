import { NavLink, useLocation } from "react-router-dom";

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

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 1 0-16 0"></path>
      <circle cx="12" cy="8" r="4"></circle>
    </svg>
  );
}

export default function DashboardSidebar({ profile, menu }) {
  const location = useLocation();

  return (
    <aside className="panel-control-sidebar">
      <div className="panel-control-profile-card">
        <div className="panel-control-profile-avatar">
          <img alt={profile.name} src={profile.avatar} />
        </div>
        <h2>{profile.name}</h2>
        <p>{profile.level}</p>

        <div className="panel-control-points-card">
          <span>Puntos acumulados</span>
          <strong>{profile.points}</strong>
        </div>
      </div>

      <nav className="panel-control-nav-card">
        <h3>Cuenta</h3>
        <div className="panel-control-nav-list">
          {menu.map((item) => {
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
    </aside>
  );
}
