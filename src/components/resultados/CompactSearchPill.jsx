import { useState } from "react";
import { createPortal } from "react-dom";
import SearchPanel from "../buscador/SearchPanel";

export default function CompactSearchPill({ destination = "Leticia, Colombia" }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        className="compact-search-pill" 
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
      >
        <div className="compact-search-content">
          <span className="compact-search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <span className="compact-search-text">{destination}</span>
        </div>
        <button className="compact-search-button" aria-label="Buscar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      {showModal && createPortal(
        <div className="search-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="search-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="search-modal-close" onClick={() => setShowModal(false)}>&times;</button>
            <div className="search-modal-header">
              <h3>Modificar búsqueda</h3>
            </div>
            <div className="search-modal-content">
              <SearchPanel />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
