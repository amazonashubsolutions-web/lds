import { useEffect, useMemo, useState } from "react";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import DashboardProductsSection from "../components/panel-control/DashboardProductsSection";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import Footer from "../components/resultados/Footer";
import { usePanelSession } from "../contexts/PanelSessionContext";
import {
  footerData,
  panelControlMenu,
  panelControlProfile,
} from "../data/panelControlData";
import { resultCategories } from "../data/resultadosData";
import { fetchAdminPanelProductItemsFromSupabase } from "../services/products/adminCatalog";

const ALL_CATEGORY_FILTER = "all";
const ALL_STATUS_FILTER = "all";

function formatCompactPrice(value) {
  return `$${new Intl.NumberFormat("es-CO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function normalizeValue(value) {
  return String(value ?? "").toLowerCase().trim();
}

export default function PanelControlProductsPage() {
  const { profile, isProfileLoading } = usePanelSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_FILTER);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS_FILTER);
  const [productItems, setProductItems] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsLoadError, setProductsLoadError] = useState("");
  const normalizedSearchTerm = normalizeValue(searchTerm);
  const filteredProductItems = useMemo(
    () =>
      productItems.filter((item) => {
        const searchableContent = [
          item.title,
          item.location,
          item.categoryLabel,
          item.departurePoint,
          ...item.subcategoryLabels,
        ]
          .map(normalizeValue)
          .join(" ");
        const matchesSearch = !normalizedSearchTerm || searchableContent.includes(normalizedSearchTerm);
        const matchesCategory =
          selectedCategory === ALL_CATEGORY_FILTER || item.categoryId === selectedCategory;
        const matchesStatus =
          selectedStatus === ALL_STATUS_FILTER || item.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [normalizedSearchTerm, productItems, selectedCategory, selectedStatus],
  );
  const visibleProducts = filteredProductItems.length;
  const inactiveCount = filteredProductItems.filter((item) => item.status === "inactive").length;
  const lowestPrice = visibleProducts
    ? Math.min(...filteredProductItems.map((item) => item.price))
    : 0;
  const highestPrice = visibleProducts
    ? Math.max(...filteredProductItems.map((item) => item.price))
    : 0;
  const categoryHighlights = [...resultCategories]
    .map((category) => ({
      id: category.id,
      label: category.label,
      total: filteredProductItems.filter((item) => item.categoryId === category.id).length,
    }))
    .filter((category) => category.total > 0)
    .sort((left, right) => right.total - left.total);
  const activeCategoryCount = categoryHighlights.length;
  const highlightedCategories = categoryHighlights.slice(0, 3);
  const hiddenCategoryCount = Math.max(0, categoryHighlights.length - highlightedCategories.length);
  const hasActiveFilters =
    normalizedSearchTerm.length > 0 ||
    selectedCategory !== ALL_CATEGORY_FILTER ||
    selectedStatus !== ALL_STATUS_FILTER;
  const canAccessProductsPanel =
    profile?.role === "super_user" || profile?.agency?.agency_type === "provider";

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProducts(true);
    setProductsLoadError("");

    fetchAdminPanelProductItemsFromSupabase()
      .then((items) => {
        if (!isMounted || !Array.isArray(items)) {
          return;
        }

        setProductItems(items);
      })
      .catch((error) => {
        if (isMounted) {
          setProductItems([]);
          setProductsLoadError(
            error?.message ||
              "No fue posible consultar los productos en Supabase. Verifica la sesion o la conexion e intenta de nuevo.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function resetFilters() {
    setSearchTerm("");
    setSelectedCategory(ALL_CATEGORY_FILTER);
    setSelectedStatus(ALL_STATUS_FILTER);
  }

  if (!isProfileLoading && !canAccessProductsPanel) {
    return (
      <div className="panel-control-page">
        <PrimaryHeader />

        <main className="panel-control-main">
          <div className="panel-control-layout">
            <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

            <section className="panel-control-content panel-control-products-page">
              <section className="detalle-producto-unavailable">
                <div className="detalle-producto-unavailable-card">
                  <p>Acceso restringido</p>
                  <h1>Este modulo solo aplica para agencias proveedoras</h1>
                  <span>
                    Los usuarios de agencias vendedoras no gestionan productos
                    desde este panel.
                  </span>
                </div>
              </section>
            </section>
          </div>
        </main>

        <Footer data={footerData} />
      </div>
    );
  }

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

          <section className="panel-control-content panel-control-products-page">
            <header className="panel-control-products-hero">
              <div className="panel-control-products-hero-copy">
                <p>Panel de productos</p>

                <div className="panel-control-products-hero-tags">
                  {highlightedCategories.length > 0 ? (
                    <>
                      {highlightedCategories.map((category) => (
                        <span className="panel-control-products-hero-tag" key={category.id}>
                          {category.label} - {category.total}
                        </span>
                      ))}
                      {hiddenCategoryCount > 0 ? (
                        <span className="panel-control-products-hero-tag">
                          +{hiddenCategoryCount} categorias mas
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="panel-control-products-hero-tag">
                      Ajusta los filtros para volver a ver resultados
                    </span>
                  )}
                </div>
              </div>

            </header>

            <section className="panel-control-products-overview-grid">
              <article className="panel-control-products-overview-card">
                <span>Productos visibles</span>
                <strong>{visibleProducts}</strong>
                <p>Inventario que coincide ahora mismo con la busqueda aplicada.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Productos inactivos</span>
                <strong>{inactiveCount}</strong>
                <p>Productos visibles que hoy no estan activos para gestion comercial.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Precio minimo</span>
                <strong>{formatCompactPrice(lowestPrice)}</strong>
                <p>Tarifa base mas baja dentro de los productos visibles en esta vista.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Precio maximo</span>
                <strong>{formatCompactPrice(highestPrice)}</strong>
                <p>Tarifa base mas alta dentro de los productos visibles en esta vista.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>CATEGORIAS</span>
                <strong>{activeCategoryCount}</strong>
                <p>Lineas del catalogo representadas en la vista filtrada actual.</p>
              </article>
            </section>

            <section className="panel-control-products-filters panel-control-card">
              <div className="panel-control-products-filters-head">
                {hasActiveFilters ? (
                  <button
                    className="panel-control-products-reset"
                    type="button"
                    onClick={resetFilters}
                  >
                    Limpiar filtros
                  </button>
                ) : null}
              </div>

              <div className="panel-control-products-filters-grid">
                <label className="panel-control-coupons-filter-field panel-control-products-filter-field panel-control-products-filter-field--search">
                  <span>Buscar producto</span>
                  <div className="panel-control-coupons-search-input">
                    <span className="material-icons-outlined" aria-hidden="true">
                      search
                    </span>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Nombre, destino, categoria o punto de salida"
                    />
                  </div>
                </label>

                <label className="panel-control-coupons-filter-field panel-control-products-filter-field">
                  <span>Categoria</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                  >
                    <option value={ALL_CATEGORY_FILTER}>Todas</option>
                    {resultCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="panel-control-coupons-filter-field panel-control-products-filter-field">
                  <span>Estado</span>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value={ALL_STATUS_FILTER}>Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </label>
              </div>
            </section>

            <DashboardProductsSection
              items={filteredProductItems}
              totalItems={productItems.length}
              isLoading={isLoadingProducts}
              errorMessage={productsLoadError}
            />
          </section>
        </div>
      </main>

      <Footer data={footerData} />

    </div>
  );
}
