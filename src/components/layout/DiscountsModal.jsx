import { createPortal } from "react-dom";
import { discountsData } from "../../data/discountsData";

export default function DiscountsModal({ onClose }) {
  return createPortal(
    <div className="discounts-modal-backdrop" onClick={onClose} role="presentation">
      <div className="discounts-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="discounts-title">
        <div className="discounts-modal-header">
          <h2 id="discounts-title">Ofertas Especiales LDS</h2>
          <button className="discounts-modal-close" onClick={onClose} type="button" aria-label="Cerrar">&times;</button>
        </div>
        
        <div className="discounts-modal-content">
          <div className="discounts-list">
            {discountsData.map((offer) => (
              <div key={offer.id} className="discount-card">
                <div className="discount-card-image">
                  <img src={offer.image} alt={offer.title} />
                  <div className="discount-badge">{offer.discount}% OFF</div>
                </div>
                
                <div className="discount-card-body">
                  <span className="discount-agency">{offer.agency}</span>
                  <h3>{offer.title}</h3>
                  <div className="discount-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {offer.city}
                  </div>
                  
                  <div className="discount-dates">
                    <div className="discount-date-item">
                      <span>Inicio:</span> <strong>{offer.startDate}</strong>
                    </div>
                    <div className="discount-date-item">
                      <span>Vence:</span> <strong>{offer.endDate}</strong>
                    </div>
                  </div>
                  
                  <div className="discount-coupon-section">
                    <p className="discount-coupon-label">🎉 Use este cupón para obtener el descuento:</p>
                    <div className="discount-coupon-code">
                      <code>{offer.couponCode}</code>
                    </div>
                  </div>
                  
                  <div className="discount-rules">
                    <strong>Regla de uso:</strong>
                    <p>{offer.usageRule}</p>
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
