import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import "./DetalleProductoHeader.css";

export default function ProductAdminActionBar({
  couponCount = 0,
  canManageProductActions = true,
  canViewProviderReadOnlyActions = true,
  isInactive,
  isEditing = false,
  showStatusAction = true,
  onViewHistory,
  onCreateCoupon,
  onViewCoupons,
  onToggleStatus,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onViewCapacityConfig,
  onViewSeasonDates,
  isSavingEdit = false,
  isUpdatingStatus = false,
  isLoadingCoupons = false,
  statusActionLabel = "",
  statusActionIconName = "",
  isStatusActionDisabled = false,
}) {
  const navigate = useNavigate();

  return (
    <section className="detalle-producto-admin-actions">
      <div className="detalle-producto-admin-actions-copy" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexDirection: 'row' }}>
        {!isEditing && (
          <button 
            type="button" 
            className="detalle-producto-header-back"
            onClick={() => navigate("/panel-de-control/productos")}
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
              disabled={isSavingEdit}
            >
              <span className="lds-button-content">
                {isSavingEdit ? (
                  <LoadingSpinner label="Guardando cambios" size="sm" />
                ) : (
                  <span className="material-icons-outlined" aria-hidden="true">
                    save
                  </span>
                )}
                <span>{isSavingEdit ? "Guardando..." : "Guardar cambios"}</span>
              </span>
            </button>

            <button
              type="button"
              className="detalle-producto-admin-action detalle-producto-admin-action--danger"
              onClick={onCancelEdit}
              disabled={isSavingEdit}
            >
              <span className="material-icons-outlined" aria-hidden="true">
                close
              </span>
              <span>Cancelar</span>
            </button>
          </>
        ) : (
          <>
            {canViewProviderReadOnlyActions ? (
              <>
                <button
                  type="button"
                  className="detalle-producto-admin-action"
                  onClick={onViewCapacityConfig}
                  disabled={isUpdatingStatus}
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    groups
                  </span>
                  <span>Ver Cupos</span>
                </button>

                <button
                  type="button"
                  className="detalle-producto-admin-action"
                  onClick={onViewCoupons}
                  disabled={isLoadingCoupons || isUpdatingStatus}
                >
                  <span className="lds-button-content">
                    {isLoadingCoupons ? (
                      <LoadingSpinner label="Cargando cupones" size="sm" />
                    ) : (
                      <span className="material-icons-outlined" aria-hidden="true">
                        confirmation_number
                      </span>
                    )}
                    <span>{isLoadingCoupons ? "Cargando..." : "Ver cupones"}</span>
                  </span>
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
              </>
            ) : null}

            {canManageProductActions ? (
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
                  disabled={isLoadingCoupons || isUpdatingStatus}
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    sell
                  </span>
                  <span>Crear cupon</span>
                </button>

                <button
                  type="button"
                  className="detalle-producto-admin-action"
                  onClick={onViewHistory}
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    history
                  </span>
                  <span>Historial</span>
                </button>

                {showStatusAction ? (
                  <button
                    type="button"
                    className="detalle-producto-admin-action detalle-producto-admin-action--danger"
                    onClick={onToggleStatus}
                    disabled={
                      isUpdatingStatus || isLoadingCoupons || isStatusActionDisabled
                    }
                  >
                    <span className="lds-button-content">
                      {isUpdatingStatus ? (
                        <LoadingSpinner label="Actualizando estado" size="sm" />
                      ) : (
                        <span className="material-icons-outlined" aria-hidden="true">
                          {statusActionIconName ||
                            (isInactive ? "published_with_changes" : "block")}
                        </span>
                      )}
                      <span>
                        {isUpdatingStatus
                          ? "Actualizando..."
                          : statusActionLabel ||
                            (isInactive ? "Habilitar" : "Inhabilitar")}
                      </span>
                    </span>
                  </button>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
