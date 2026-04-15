import { Link } from "react-router-dom";
import LoadingState from "../common/LoadingState";

function formatProductPrice(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function DashboardProductsSection({
  items,
  totalItems = items.length,
  isLoading = false,
  errorMessage = "",
}) {
  return (
    <section className="panel-control-card panel-control-products-section">
      <div className="panel-control-products-head">
        <div>
          <h2>Inventario activo del catalogo</h2>
          <p>
            Recorre el portafolio con una lectura visual de cada producto y
            activa cupones comerciales sin salir del inventario.
          </p>
        </div>
        <div className="panel-control-products-head-side">
          <span className="panel-control-products-count">
            {items.length} de {totalItems} productos
          </span>
          <small>
            Entra a cada ficha para gestionar precios, cupones y estado del producto.
          </small>
        </div>
      </div>

      {isLoading ? (
        <div className="panel-control-products-empty-state">
          <LoadingState
            className="panel-products-loading-state"
            title="Cargando productos desde Supabase"
            description="Estamos consultando el catalogo mas reciente para mostrarlo en el panel."
          />
        </div>
      ) : errorMessage ? (
        <div className="panel-control-products-empty-state">
          <strong>No pudimos cargar los productos.</strong>
          <p>{errorMessage}</p>
        </div>
      ) : items.length > 0 ? (
        <div className="panel-control-products-list">
          {items.map((item) => {
            const isInactive = item.status === "inactive";
            const summaryLabel = `${formatProductPrice(item.price)} ${item.priceSuffix}`;
            const statusLabel = isInactive ? "Inactivo" : "Activo";
            const statusBadgeClass = isInactive
              ? "panel-control-product-media-badge panel-control-product-media-badge--inactive"
              : "panel-control-product-media-badge panel-control-product-media-badge--active";
            const categorySummary = item.subcategoryLabels[0]
              ? `${item.categoryLabel} - ${item.subcategoryLabels[0]}`
              : item.categoryLabel;

            return (
              <article className="result-card panel-control-product-card" key={item.id}>
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

                    <Link className="result-card-cta" to={`/panel-de-control/productos/${item.id}`}>
                      Ver producto
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel-control-products-empty-state">
          <strong>
            {totalItems === 0
              ? "No hay productos cargados en Supabase."
              : "No encontramos productos con esos filtros."}
          </strong>
          <p>
            {totalItems === 0
              ? "Cuando existan productos disponibles en la base, apareceran aqui automaticamente."
              : "Prueba con otra categoria, cambia el estado o limpia la busqueda para volver a ver el inventario completo."}
          </p>
        </div>
      )}
    </section>
  );
}
