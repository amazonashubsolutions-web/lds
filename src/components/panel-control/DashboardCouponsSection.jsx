import { useState } from "react";

function CouponStatusBadge({ status }) {
  const tone =
    status === "Activo"
      ? "panel-control-coupon-status panel-control-coupon-status--active"
      : "panel-control-coupon-status panel-control-coupon-status--inactive";

  return <span className={tone}>{status}</span>;
}

export default function DashboardCouponsSection({
  title,
  description,
  actionLabel,
  items,
  columns,
  summaryPrimaryKey,
  summarySecondaryKey,
  onEditItem,
  onToggleStatusItem,
  emptyMessage = "No hay cupones para mostrar en este momento.",
}) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="panel-control-card panel-control-coupons-section">
      <div className="panel-control-coupons-head">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>

        {actionLabel ? (
          <button type="button" className="panel-control-coupons-action">
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="panel-control-coupons-list">
        {items.length === 0 ? (
          <div className="panel-control-coupons-empty">
            <span className="material-icons-outlined" aria-hidden="true">
              search_off
            </span>
            <p>{emptyMessage}</p>
          </div>
        ) : null}

        {items.map((item) => {
          const isOpen = openId === item.id;
          const showHeaderActions = Boolean(onEditItem || onToggleStatusItem);
          const toggleStatusLabel =
            item.status === "Activo" ? "Inhabilitar" : "Habilitar";
          const toggleStatusIcon =
            item.status === "Activo" ? "block" : "published_with_changes";

          return (
            <article className="panel-control-coupon-card" key={item.id}>
              <div
                className={
                  [
                    "panel-control-coupon-summary-shell",
                    isOpen
                      ? "panel-control-coupon-summary-shell--open"
                      : "",
                    showHeaderActions
                      ? "panel-control-coupon-summary-shell--actions"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                <button
                  type="button"
                  className={
                    isOpen
                      ? "panel-control-coupon-summary panel-control-coupon-summary--open"
                      : "panel-control-coupon-summary"
                  }
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  <div className="panel-control-coupon-summary-grid">
                    <div className="panel-control-coupon-summary-field">
                      <span>ID</span>
                      <p className="panel-control-coupon-id">{item.id}</p>
                    </div>

                    <div className="panel-control-coupon-summary-field">
                      <span>{columns.find((column) => column.key === summaryPrimaryKey)?.label}</span>
                      <h3>{item[summaryPrimaryKey]}</h3>
                    </div>

                    <div className="panel-control-coupon-summary-field">
                      <span>{columns.find((column) => column.key === summarySecondaryKey)?.label}</span>
                      <strong>{item[summarySecondaryKey]}</strong>
                    </div>

                    {item.createdAt ? (
                      <div className="panel-control-coupon-summary-field">
                        <span>Fecha de creacion</span>
                        <small className="panel-control-coupon-summary-date">
                          {item.createdAt}
                        </small>
                      </div>
                    ) : null}
                  </div>

                  <div className="panel-control-coupon-summary-side">
                    <CouponStatusBadge status={item.status} />
                    <span
                      className="material-icons-outlined panel-control-coupon-chevron"
                      aria-hidden="true"
                    >
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                </button>

                {showHeaderActions ? (
                  <div className="panel-control-coupon-header-actions">
                    {onEditItem ? (
                      <button
                        type="button"
                        className="panel-control-coupon-header-action"
                        onClick={() => onEditItem(item)}
                      >
                        <span className="material-icons-outlined" aria-hidden="true">
                          edit
                        </span>
                        <span>Editar</span>
                      </button>
                    ) : null}

                    {onToggleStatusItem ? (
                      <button
                        type="button"
                        className="panel-control-coupon-header-action panel-control-coupon-header-action--danger"
                        onClick={() => onToggleStatusItem(item)}
                      >
                        <span className="material-icons-outlined" aria-hidden="true">
                          {toggleStatusIcon}
                        </span>
                        <span>{toggleStatusLabel}</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {isOpen ? (
                <div className="panel-control-coupon-grid">
                  {columns.map((column) => {
                    if (
                      column.key === "status" ||
                      column.key === summaryPrimaryKey ||
                      column.key === summarySecondaryKey
                    ) {
                      return null;
                    }

                    return (
                      <div className="panel-control-coupon-field" key={column.key}>
                        <span>{column.label}</span>
                        <strong>{item[column.key]}</strong>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
