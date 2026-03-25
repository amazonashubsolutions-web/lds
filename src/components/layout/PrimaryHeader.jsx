export default function PrimaryHeader({ links }) {
  return (
    <header className="primary-header">
      <nav className="primary-nav">
        <a className="primary-logo-link" href="/buscador" aria-label="LDS home">
          <img
            src="/images/Logo/logo-lds-blanco.png"
            alt="LDS"
            className="primary-logo-image"
          />
        </a>

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

        <div className="primary-actions">
          <button className="primary-action-button" type="button">
            <span className="primary-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <path d="M16 17l5-5-5-5"></path>
                <path d="M21 12H9"></path>
              </svg>
            </span>
            <span>Salir</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
