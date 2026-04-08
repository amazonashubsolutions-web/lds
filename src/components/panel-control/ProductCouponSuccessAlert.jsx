export default function ProductCouponSuccessAlert({ message, onClose }) {
  if (!message) {
    return null;
  }

  const { couponId, couponName, productName } = message;

  return (
    <div className="panel-control-product-coupon-success-backdrop" onClick={onClose}>
      <div
        className="panel-control-product-coupon-success-alert"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="panel-control-product-coupon-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-control-product-coupon-success-icon" aria-hidden="true">
          <span className="material-icons-outlined">check_circle</span>
        </div>

        <div className="panel-control-product-coupon-success-copy">
          <p>Cupon creado</p>
          <h3 id="panel-control-product-coupon-success-title">
            {`Cupon creado ${couponId}`}
          </h3>
          <span>{`El cupon ${couponName} se creo correctamente para ${productName}.`}</span>
        </div>

        <button
          type="button"
          className="panel-control-product-coupon-success-button"
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
