import { createPortal } from "react-dom";
import { privacyData } from "../../data/privacyData";

export default function PrivacyModal({ onClose }) {
  return createPortal(
    <div className="privacy-modal-backdrop" onClick={onClose} role="presentation">
      <div className="privacy-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <div className="privacy-modal-header">
          <h2 id="privacy-title">Políticas de Privacidad</h2>
          <button className="privacy-modal-close" onClick={onClose} type="button" aria-label="Cerrar">&times;</button>
        </div>
        
        <div className="privacy-modal-content">
          <div className="privacy-legal-text">
            <p className="privacy-updated">Última actualización: 25 de Marzo, 2026</p>
            
            {privacyData.map((section, index) => (
              <div key={index} className="privacy-section">
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
            
            <div className="privacy-footer">
              <p>Al utilizar el sistema de reservas de LDS, aceptas los términos descritos en esta política.</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
