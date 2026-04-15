import { Link } from "react-router-dom";

function formatProductPrice(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function ResultCard({ item, searchedDate = "" }) {
  const isInactive = item.status === "inactive";
  const summaryLabel = `${formatProductPrice(item.price)} ${item.priceSuffix}`;
  const statusLabel = isInactive ? "Inactivo" : "Activo";
  const statusBadgeClass = isInactive
    ? "panel-control-product-media-badge panel-control-product-media-badge--inactive"
    : "panel-control-product-media-badge panel-control-product-media-badge--active";
  const categorySummary = item.subcategoryLabels?.[0]
    ? `${item.categoryLabel} - ${item.subcategoryLabels[0]}`
    : item.categoryLabel;
  const detailRouteSegment = item.routeKey ?? item.id;
  const detailPath = searchedDate
    ? `/detalle-producto/${detailRouteSegment}?fecha=${encodeURIComponent(searchedDate)}`
    : `/detalle-producto/${detailRouteSegment}`;

  return (
    <article className="result-card panel-control-product-card">
      <div className="result-card-media panel-control-product-result-media">
        <img src={item.image} alt={item.title} />
        <span className="panel-control-product-media-id">#{item.id}</span>
        <span className={statusBadgeClass}>{statusLabel}</span>
      </div>

      <div className="result-card-body panel-control-product-result-body">
        <p className="result-card-category">{categorySummary}</p>

        <div className="result-card-head panel-control-product-result-head">
          <h3>{item.title}</h3>
        </div>

        <div className="panel-control-product-result-meta">
          <div className="panel-control-product-result-meta-item">
            <span>Horario de salida</span>
            <strong>{item.departureTime}</strong>
          </div>
          <div className="panel-control-product-result-meta-item">
            <span>Punto de encuentro</span>
            <strong>{item.departurePoint}</strong>
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
