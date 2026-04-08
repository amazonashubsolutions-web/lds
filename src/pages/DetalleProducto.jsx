import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import ProductCouponManager from "../components/detalle-producto/ProductCouponManager";
import { getPanelProductItemById } from "../utils/panelControlProducts";
import { getAllProductCouponRecords } from "../utils/productCouponsStorage";
import { toProductCouponItem } from "../data/couponsData";

import ProductBookingCard from "../components/detalle-producto/ProductBookingCard";
import ProductTransportBookingCard from "../components/detalle-producto/ProductTransportBookingCard";
import ProductRestaurantBookingCard from "../components/detalle-producto/ProductRestaurantBookingCard";
import ProductPlanBookingCard from "../components/detalle-producto/ProductPlanBookingCard";
import ProductExcursionBookingCard from "../components/detalle-producto/ProductExcursionBookingCard";
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
import DetalleProductoHeader from "../components/detalle-producto/DetalleProductoHeader";
import ProductSeasonDatesModal from "../components/detalle-producto/ProductSeasonDatesModal";
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
  const detail = getDetalleProducto(productId);

  if (!detail) {
    return (
      <div className="detalle-producto-page">
        <DetalleProductoHeader couponCount={0} />
        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <p>Producto no encontrado</p>
              <h1>No pudimos abrir esta ficha</h1>
              <span>
                El producto que intentas consultar no existe o ya no esta disponible
                en el catalogo.
              </span>
              <Link className="detalle-producto-unavailable-button" to="/resultados">
                Volver a resultados
              </Link>
            </div>
          </section>
        </main>
        <Footer data={footerData} />
      </div>
    );
  }

  return <DetalleProductoResolvedPage detail={detail} />;
}

function DetalleProductoResolvedPage({ detail }) {
  const [searchParams] = useSearchParams();
  const [, setStatusRefreshVersion] = useState(0);
  const [, setCouponRefreshKey] = useState(0);
  const [isSeasonDatesModalOpen, setIsSeasonDatesModalOpen] = useState(false);
  const couponManagerRef = useRef(null);
  const relatedItems = getRelatedProducts(detail.id);
  const searchedDate = searchParams.get("fecha") ?? "";
  
  const panelProduct = useMemo(() => getPanelProductItemById(detail.id), [detail.id]);
  
  const resolvedStatus = getResolvedProductStatus(detail.id, detail.status);
  const isInactive = resolvedStatus === "inactive";

  const productCouponItems = getAllProductCouponRecords()
    .filter((coupon) => coupon.productId === detail.id)
    .map(toProductCouponItem);

  useEffect(() => {
    return subscribeToProductStatusChanges(() => {
      setStatusRefreshVersion((current) => current + 1);
    });
  }, []);

  return (
    <div className="detalle-producto-page">
      <DetalleProductoHeader 
        onViewCoupons={() => couponManagerRef.current?.openListModal()}
        onViewSeasonDates={() => setIsSeasonDatesModalOpen(true)}
        couponCount={productCouponItems.length}
      />

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
                    {detail.categoryId === "transporte" ? (
                      <ProductTransportBookingCard
                        key={`transport-booking-${detail.id}-${searchedDate || "sin-fecha"}`}
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                        meta={detail.meta}
                      />
                    ) : detail.categoryId === "restaurantes" ? (
                      <ProductRestaurantBookingCard
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                      />
                    ) : detail.categoryId === "excursiones" ? (
                      <ProductExcursionBookingCard
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                        comfortLevel={
                          detail.subcategoryIds?.includes("excursion-confort") ? "confort" :
                          detail.subcategoryIds?.includes("excursion-fuera-de-confort") ? "aventura" :
                          detail.subcategoryIds?.includes("excursion-basico") ? "basico" : "confort"
                        }
                      />
                    ) : detail.categoryId === "planes" ? (
                      <ProductPlanBookingCard
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                      />
                    ) : (
                      <ProductBookingCard
                        key={`activity-booking-${detail.id}-${searchedDate || "sin-fecha"}`}
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <RelatedProductsSection items={relatedItems} />
          </>
        )}
      </main>

      <Footer data={footerData} />

      <ProductCouponManager
        ref={couponManagerRef}
        productName={detail.title}
        productImage={detail.galleryImages[0] ?? "/images/home/1.jpg"}
        panelProduct={panelProduct}
        productCouponItems={productCouponItems}
        onCouponCreated={() => setCouponRefreshKey((k) => k + 1)}
      />

      {isSeasonDatesModalOpen ? (
        <ProductSeasonDatesModal
          periods={detail.booking?.pricingDetails?.seasons?.high?.periods}
          onClose={() => setIsSeasonDatesModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
