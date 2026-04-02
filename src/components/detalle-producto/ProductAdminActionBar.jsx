import { useNavigate } from "react-router-dom";
import "./DetalleProductoHeader.css";

export default function ProductAdminActionBar({
  productId,
  couponCount = 0,
  isInactive,
  isEditing = false,
  onCreateCoupon,
  onViewCoupons,
  onToggleStatus,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onViewSeasonDates,
}) {
  const navigate = useNavigate();

  return (
    <section className="detalle-producto-admin-actions">
      <div className="detalle-producto-admin-actions-copy" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexDirection: 'row' }}>
        {!isEditing && (
          <button 
            type="button" 
            className="detalle-producto-header-back"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)' }}
          >
            <span className="material-icons-outlined">arrow_back_ios_new</span>
            <span>Volver</span>
          </button>
        )}
        <div>
          <p>{isEditing ? "Editando producto" : "Acciones del producto"}</p>
        </div>
      </div>

      <div className="detalle-producto-admin-actions-grid">
        {isEditing ? (
          <>
            <button
              type="button"
              className="detalle-producto-admin-action"
              onClick={onSaveEdit}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                save
              </span>
              <span>Guardar cambios</span>
            </button>

            <button
              type="button"
              className="detalle-producto-admin-action detalle-producto-admin-action--danger"
              onClick={onCancelEdit}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                close
              </span>
              <span>Cancelar</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="detalle-producto-admin-action"
              onClick={onEdit}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                edit
              </span>
              <span>Editar</span>
            </button>

            <button
              type="button"
              className="detalle-producto-admin-action"
              onClick={onCreateCoupon}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                sell
              </span>
              <span>Crear cupon</span>
            </button>

            <button
              type="button"
              className="detalle-producto-admin-action"
              onClick={onViewCoupons}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                confirmation_number
              </span>
              <span>Ver cupones</span>
              <strong className="detalle-producto-admin-action-badge">
                {couponCount}
              </strong>
            </button>

            <button
              type="button"
              className="detalle-producto-admin-action"
              onClick={onViewSeasonDates}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                date_range
              </span>
              <span>Fechas de temporada</span>
            </button>

            <button
              type="button"
              className="detalle-producto-admin-action detalle-producto-admin-action--danger"
              onClick={onToggleStatus}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                {isInactive ? "published_with_changes" : "block"}
              </span>
              <span>{isInactive ? "Habilitar" : "Inhabilitar"}</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
