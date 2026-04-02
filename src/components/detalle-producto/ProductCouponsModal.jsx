import { createPortal } from "react-dom";

export default function ProductCouponsModal({
  isOpen,
  productName,
  productImage,
  items,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="product-coupons-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="product-coupons-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-coupons-modal-title"
      >
        <div className="product-coupons-modal-header">
          <div className="product-coupons-modal-header-copy">
            <p>Cupones del producto</p>
            <h2 id="product-coupons-modal-title">{productName}</h2>
            <span>{`${items.length} cupon${items.length === 1 ? "" : "es"} relacionado${items.length === 1 ? "" : "s"}`}</span>
          </div>

          <button
            className="product-coupons-modal-close"
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal de cupones"
          >
            &times;
          </button>
        </div>

        <div className="product-coupons-modal-content">
          {items.length === 0 ? (
            <div className="product-coupons-modal-empty">
              <span className="material-icons-outlined" aria-hidden="true">
                confirmation_number
              </span>
              <h3>Este producto todavia no tiene cupones</h3>
              <p>
                Crea un cupon desde la barra de acciones y luego lo veras aqui
                mismo.
              </p>
            </div>
          ) : (
            <div className="product-coupons-modal-list">
              {items.map((coupon) => (
                <article className="product-coupons-modal-card" key={coupon.id}>
                  <div className="product-coupons-modal-card-image">
                    <img
                      src={productImage}
                      alt={`${productName} ${coupon.couponName}`}
                    />
                    <div className="product-coupons-modal-card-badge">
                      {coupon.discountValue}
                    </div>
                  </div>

                  <div className="product-coupons-modal-card-body">
                    <div className="product-coupons-modal-card-topline">
                      <span
                        className={`product-coupons-modal-status${
                          coupon.status === "Activo"
                            ? " product-coupons-modal-status--active"
                            : " product-coupons-modal-status--inactive"
                        }`}
                      >
                        {coupon.status}
                      </span>
                      <code>{coupon.id}</code>
                    </div>

                    <h3>{coupon.couponName}</h3>
                    <p>{coupon.description || "Sin descripcion registrada."}</p>

                    <div className="product-coupons-modal-details">
                      <div className="product-coupons-modal-detail">
                        <span>Target</span>
                        <strong>{coupon.discountTarget}</strong>
                      </div>
                      <div className="product-coupons-modal-detail">
                        <span>Creado</span>
                        <strong>{coupon.createdAt}</strong>
                      </div>
                      <div className="product-coupons-modal-detail">
                        <span>Vigencia</span>
                        <strong>{`${coupon.startsAt} - ${coupon.endsAt}`}</strong>
                      </div>
                    </div>

                    <div className="product-coupons-modal-code-ticket">
                      <div className="product-coupons-modal-code-ticket-copy">
                        <span
                          className="material-icons-outlined product-coupons-modal-code-ticket-icon"
                          aria-hidden="true"
                        >
                          confirmation_number
                        </span>
                        <p>Usa este cupon para obtener el descuento:</p>
                      </div>
                      <strong>{coupon.couponName}</strong>
                    </div>

                    <div className="product-coupons-modal-rule">
                      <span>Regla</span>
                      <strong>{coupon.rule || "Sin regla configurada."}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
