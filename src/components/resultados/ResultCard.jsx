import { Link } from "react-router-dom";

import { getPanelProductCardItem } from "../../utils/panelControlProducts";

function formatProductPrice(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function ResultCard({ item, searchedDate = "" }) {
  const cardItem = getPanelProductCardItem(item);
  const isInactive = cardItem.status === "inactive";
  const summaryLabel = `${formatProductPrice(cardItem.price)} ${cardItem.priceSuffix}`;
  const statusLabel = isInactive ? "Inactivo" : "Activo";
  const statusBadgeClass = isInactive
    ? "panel-control-product-media-badge panel-control-product-media-badge--inactive"
    : "panel-control-product-media-badge panel-control-product-media-badge--active";
  const categorySummary = cardItem.subcategoryLabels[0]
    ? `${cardItem.categoryLabel} - ${cardItem.subcategoryLabels[0]}`
    : cardItem.categoryLabel;
  const detailPath = searchedDate
    ? `/detalle-producto/${cardItem.id}?fecha=${encodeURIComponent(searchedDate)}`
    : `/detalle-producto/${cardItem.id}`;

  return (
    <article className="result-card panel-control-product-card">
      <div className="result-card-media panel-control-product-result-media">
        <img src={cardItem.image} alt={cardItem.title} />
        <span className="panel-control-product-media-id">#{cardItem.id}</span>
        <span className={statusBadgeClass}>{statusLabel}</span>
      </div>

      <div className="result-card-body panel-control-product-result-body">
        <p className="result-card-category">{categorySummary}</p>

        <div className="result-card-head panel-control-product-result-head">
          <h3>{cardItem.title}</h3>
        </div>

        <div className="panel-control-product-result-meta">
          <div className="panel-control-product-result-meta-item">
            <span>Horario de salida</span>
            <strong>{cardItem.departureTime}</strong>
          </div>
          <div className="panel-control-product-result-meta-item">
            <span>Punto de encuentro</span>
            <strong>{cardItem.departurePoint}</strong>
          </div>
        </div>

        <div className="result-card-footer panel-control-product-result-footer">
          <div className="result-card-price">
            <span>Precio base</span>
            <strong>{summaryLabel}</strong>
          </div>

          <Link className="result-card-cta" to={detailPath}>
            Ver producto
          </Link>
        </div>
      </div>
    </article>
  );
}
