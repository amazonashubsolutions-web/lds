import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import ProductBookingCard from "../components/detalle-producto/ProductBookingCard";
import ProductExcludes from "../components/detalle-producto/ProductExcludes";
import ProductGallery from "../components/detalle-producto/ProductGallery";
import ProductHeroInfo from "../components/detalle-producto/ProductHeroInfo";
import ProductIncludes from "../components/detalle-producto/ProductIncludes";
import ProductItinerary from "../components/detalle-producto/ProductItinerary";
import ProductKeywordCloud from "../components/detalle-producto/ProductKeywordCloud";
import ProductOverview from "../components/detalle-producto/ProductOverview";
import ProductRecommendations from "../components/detalle-producto/ProductRecommendations";
import ProductTravelNotes from "../components/detalle-producto/ProductTravelNotes";
import RelatedProductsSection from "../components/detalle-producto/RelatedProductsSection";
import Footer from "../components/resultados/Footer";
import ResultadosHeader from "../components/resultados/ResultadosHeader";
import {
  footerData,
  getDetalleProducto,
  getRelatedProducts,
} from "../data/detalleProductoData";
import {
  getResolvedProductStatus,
  subscribeToProductStatusChanges,
} from "../utils/productStatusStorage";

export default function DetalleProductoPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const [statusRefreshVersion, setStatusRefreshVersion] = useState(0);
  const detail = getDetalleProducto(productId);
  const relatedItems = getRelatedProducts(detail.id);
  const searchedDate = searchParams.get("fecha") ?? "";
  const resolvedStatus = useMemo(
    () => getResolvedProductStatus(detail.id, detail.status),
    [detail.id, detail.status, statusRefreshVersion],
  );
  const isInactive = resolvedStatus === "inactive";

  useEffect(() => {
    return subscribeToProductStatusChanges(() => {
      setStatusRefreshVersion((current) => current + 1);
    });
  }, []);

  return (
    <div className="detalle-producto-page">
      <ResultadosHeader />

      <main className="detalle-producto-main">
        {isInactive ? (
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <p>Producto no disponible</p>
              <h1>{detail.title}</h1>
              <span>
                Este producto fue inhabilitado desde el panel de control y ya no
                esta disponible para consulta o reserva en el sitio publico.
              </span>
              <Link className="detalle-producto-unavailable-button" to="/resultados">
                Volver a resultados
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="detalle-producto-shell">
              <div className="detalle-producto-gallery-wrap">
                <ProductGallery images={detail.galleryImages} title={detail.title} />
              </div>

              <div className="detalle-producto-content-wrap">
                <div className="detalle-producto-layout">
                  <div className="detalle-producto-content">
                    <ProductHeroInfo detail={detail} />
                    <ProductOverview paragraphs={detail.overview} />
                    <ProductItinerary items={detail.itinerary} />
                    <ProductIncludes items={detail.includes} />
                    <ProductExcludes items={detail.excludes} />
                    <ProductRecommendations items={detail.recommendations} />
                    <ProductTravelNotes
                      considerations={detail.considerations}
                      cancellationPolicies={detail.cancellationPolicies}
                    />
                    <ProductKeywordCloud detail={detail} />
                  </div>

                  <div className="detalle-producto-sidebar">
                    <ProductBookingCard
                      booking={detail.booking}
                      initialTravelDate={searchedDate}
                    />
                  </div>
                </div>
              </div>
            </div>

            <RelatedProductsSection items={relatedItems} />
          </>
        )}
      </main>

      <Footer data={footerData} />
    </div>
  );
}
