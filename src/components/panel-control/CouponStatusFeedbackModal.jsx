export default function CouponStatusFeedbackModal({ notice, onClose }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className="panel-control-coupon-status-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="panel-control-coupon-status-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-control-coupon-status-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="panel-control-coupon-status-modal-close"
          onClick={onClose}
          aria-label="Cerrar notificacion de estado del cupon"
        >
          <span className="material-icons-outlined">close</span>
        </button>

        <div className="panel-control-coupon-status-modal-icon" aria-hidden="true">
          <span className="material-icons-outlined">
            {notice.action === "activated" ? "verified" : "do_not_disturb_on"}
          </span>
        </div>

        <div className="panel-control-coupon-status-modal-copy">
          <p>{notice.action === "activated" ? "Cupon activado" : "Cupon inhabilitado"}</p>
          <h3 id="panel-control-coupon-status-modal-title">{notice.couponName}</h3>
          <span>{notice.description || "Sin descripcion registrada para este cupon."}</span>
        </div>

        <div className="panel-control-coupon-status-modal-details">
          <div className="panel-control-coupon-status-modal-detail">
            <span>Producto</span>
            <strong>{notice.productName}</strong>
          </div>
          <div className="panel-control-coupon-status-modal-detail">
            <span>Estado actual</span>
            <strong>{notice.statusLabel}</strong>
          </div>
          <div className="panel-control-coupon-status-modal-detail">
            <span>Fecha del cambio</span>
            <strong>{notice.changedAtLabel}</strong>
          </div>
        </div>

        <button
          type="button"
          className="panel-control-coupon-status-modal-button"
          onClick={onClose}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
