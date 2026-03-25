import { createPortal } from "react-dom";
import { useState } from "react";
import { faqData } from "../../data/faqData";

export default function FAQModal({ onClose }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return createPortal(
    <div className="faq-modal-backdrop" onClick={onClose} role="presentation">
      <div className="faq-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="faq-title">
        <div className="faq-modal-header">
          <h2 id="faq-title">Preguntas Frecuentes</h2>
          <button className="faq-modal-close" onClick={onClose} type="button" aria-label="Cerrar">&times;</button>
        </div>
        
        <div className="faq-modal-content">
          <p className="faq-intro">Encuentra respuestas rápidas para tus reservas de tours y escapadas en el Amazonas.</p>
          
          <div className="faq-accordion">
            {faqData.map((item) => (
              <div key={item.id} className={`faq-item ${openId === item.id ? 'faq-item--open' : ''}`}>
                <button className="faq-question" onClick={() => toggle(item.id)} type="button">
                  <span>{item.question}</span>
                  <span className="faq-icon" aria-hidden="true">
                    {openId === item.id ? '−' : '+'}
                  </span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
