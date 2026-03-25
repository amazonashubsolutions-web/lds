import { useEffect, useRef, useState } from "react";

import UserStatusAvatar from "../layout/UserStatusAvatar";
import HeaderNotifications from "../layout/HeaderNotifications";
import DiscountsModal from "../layout/DiscountsModal";
import FAQModal from "../layout/FAQModal";
import PrivacyModal from "../layout/PrivacyModal";

function HelpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M12 14c0-1.5 1-2.5 1.5-3s1-1.5 1-2.5a3 3 0 1 0-6 0" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function FAQIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"></path>
      <path d="M9 12l2 2 4-4"></path>
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <path d="M8 10h8"></path>
      <path d="M8 14h5"></path>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6"></path>
    </svg>
  );
}

export default function BuscadorHeader() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const helpMenuRef = useRef(null);

  useEffect(() => {
    if (!helpOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (helpMenuRef.current?.contains(event.target)) {
        return;
      }

      setHelpOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [helpOpen]);

  return (
    <header className="buscador-header">
      <nav className="buscador-nav">
        <a
          className="buscador-logo-overlay"
          href="/buscador"
          aria-label="LDS home"
        >
          <img
            src="/images/Logo/logo-lds-blanco.png"
            alt="LDS"
            className="buscador-logo-image"
          />
        </a>

        <div className="buscador-links">
          <button
            aria-label="Descuentos"
            className="buscador-discount-link"
            type="button"
            onClick={() => setDiscountsOpen(true)}
          >
            <img
              src="/images/varios/ofertas2.png"
              alt=""
              className="buscador-discount-image"
            />
          </button>

          <div className="buscador-help-menu" ref={helpMenuRef}>
            <button
              className={
                helpOpen
                  ? "buscador-help-trigger buscador-help-trigger--open"
                  : "buscador-help-trigger"
              }
              onClick={() => setHelpOpen((current) => !current)}
              type="button"
            >
              <span className="buscador-help-icon" aria-hidden="true">
                <HelpIcon />
              </span>
              <span className="buscador-help-label">Ayuda</span>
              <span className="buscador-help-chevron" aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </button>

            {helpOpen ? (
              <div className="buscador-help-dropdown">
                <button
                  className="buscador-help-item"
                  onClick={() => {
                    setHelpOpen(false);
                    setFaqOpen(true);
                  }}
                  type="button"
                >
                  <span className="buscador-help-item-icon" aria-hidden="true">
                    <FAQIcon />
                  </span>
                  <span>Preguntas Frecuentes</span>
                </button>
                <button
                  className="buscador-help-item"
                  onClick={() => {
                    setHelpOpen(false);
                    setPrivacyOpen(true);
                  }}
                  type="button"
                >
                  <span className="buscador-help-item-icon" aria-hidden="true">
                    <PrivacyIcon />
                  </span>
                  <span>Politicas de Privacidad</span>
                </button>
                <button
                  className="buscador-help-item"
                  onClick={() => setHelpOpen(false)}
                  type="button"
                >
                  <span className="buscador-help-item-icon" aria-hidden="true">
                    <ContactIcon />
                  </span>
                  <span>Contactenos</span>
                </button>
              </div>
            ) : null}
          </div>

          <HeaderNotifications />

          <UserStatusAvatar />
        </div>
      </nav>
      {discountsOpen && <DiscountsModal onClose={() => setDiscountsOpen(false)} />}
      {faqOpen && <FAQModal onClose={() => setFaqOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </header>
  );
}
