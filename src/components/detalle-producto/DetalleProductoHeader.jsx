import { useNavigate } from "react-router-dom";
import "./DetalleProductoHeader.css";

export default function DetalleProductoHeader({ onViewCoupons, onViewSeasonDates, couponCount = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="detalle-producto-header-shell">
      <header className="detalle-producto-header">
        <div className="detalle-producto-header-copy">
          <button 
            type="button" 
            className="detalle-producto-header-back"
            onClick={() => navigate(-1)}
            aria-label="Volver"
          >
            <span className="material-icons-outlined">arrow_back_ios_new</span>
            <span>Volver</span>
          </button>
          <span className="detalle-producto-header-title">DETALLE PRODUCTO</span>
        </div>

        <div className="detalle-producto-header-grid">
          {onViewCoupons && (
            <button 
              type="button" 
              className="detalle-producto-header-action"
              onClick={onViewCoupons}
            >
              <span className="material-icons-outlined">loyalty</span>
              <span>Ver Cupones</span>
              <strong className="detalle-producto-admin-action-badge">
                {couponCount}
              </strong>
            </button>
          )}
          {onViewSeasonDates && (
            <button 
              type="button" 
              className="detalle-producto-header-action"
              onClick={onViewSeasonDates}
            >
              <span className="material-icons-outlined">calendar_month</span>
              <span>Fechas de Temporadas</span>
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
