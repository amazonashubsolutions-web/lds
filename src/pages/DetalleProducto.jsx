import { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import LoadingState from "../components/common/LoadingState";
import ProductCouponManager from "../components/detalle-producto/ProductCouponManager";
import { toProductCouponItem } from "../data/couponsData";
import useProductCouponRecords from "../hooks/useProductCouponRecords";

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
} from "../data/detalleProductoData";
import {
  fetchPublicProductDetailFromSupabase,
  fetchRelatedPublicProductsFromSupabase,
} from "../services/products/publicCatalog";


export default function DetalleProductoPage() {
  const { productId } = useParams();
  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [detailLoadError, setDetailLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoadingDetail(true);
    setDetailLoadError("");
    setDetail(null);

    fetchPublicProductDetailFromSupabase(productId)
      .then((nextDetail) => {
        if (!isMounted) {
          return;
        }

        setDetail(nextDetail ?? null);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setDetail(null);
        setDetailLoadError(
          error?.message ||
            "No fue posible consultar esta ficha en Supabase. Revisa tu conexion e intenta de nuevo.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (isLoadingDetail) {
    return (
      <div className="detalle-producto-page">
        <DetalleProductoHeader couponCount={0} />
        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <LoadingState
                className="detail-loading-state"
                title="Estamos abriendo esta ficha desde Supabase"
                description="Espera un momento mientras consultamos la informacion mas reciente del producto."
              />
            </div>
          </section>
        </main>
        <Footer data={footerData} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="detalle-producto-page">
        <DetalleProductoHeader couponCount={0} />
        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <p>{detailLoadError ? "No pudimos cargar el producto" : "Producto no encontrado"}</p>
              <h1>No pudimos abrir esta ficha</h1>
              <span>
                {detailLoadError
                  ? detailLoadError
                  : "El producto que intentas consultar no existe en Supabase o ya no esta disponible en el catalogo."}
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
  const [, setCouponRefreshKey] = useState(0);
  const [isSeasonDatesModalOpen, setIsSeasonDatesModalOpen] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const couponManagerRef = useRef(null);
  const searchedDate = searchParams.get("fecha") ?? "";
  const {
    couponRecords: productCouponRecords,
    isLoadingCoupons,
    refreshCoupons,
  } = useProductCouponRecords({
    productId: detail.id,
    publicOnly: true,
  });

  const isInactive = detail.status === "inactive";

  const productCouponItems = productCouponRecords.map(toProductCouponItem);

  useEffect(() => {
    let isMounted = true;

    fetchRelatedPublicProductsFromSupabase({
      currentProductId: detail.id,
      categoryId: detail.categoryId,
    })
      .then((items) => {
        if (isMounted) {
          setRelatedItems(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRelatedItems([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [detail.categoryId, detail.id]);

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
                        productCoupons={productCouponRecords}
                        meta={detail.meta}
                        productSummary={{
                          id: detail.id,
                          title: detail.title,
                          city: detail.city,
                          departureTime: Array.isArray(detail.meta)
                            ? detail.meta.find(
                                (item) => item.label === "Hora de salida",
                              )?.value ?? ""
                            : "",
                        }}
                      />
                    ) : detail.categoryId === "restaurantes" ? (
                      <ProductRestaurantBookingCard
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                        productSummary={{
                          id: detail.id,
                          title: detail.title,
                          city: detail.city,
                          departureTime: Array.isArray(detail.meta)
                            ? detail.meta.find(
                                (item) => item.label === "Horario",
                              )?.value ?? ""
                            : "",
                        }}
                      />
                    ) : detail.categoryId === "excursiones" ? (
                      <ProductExcursionBookingCard
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                        productSummary={{
                          id: detail.id,
                          title: detail.title,
                          city: detail.city,
                          departureTime:
                            detail.meta?.find((item) => item.label === "Hora de salida")?.value ??
                            "",
                        }}
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
                        productSummary={{
                          id: detail.id,
                          title: detail.title,
                          city: detail.city,
                          departureTime:
                            detail.meta?.find((item) => item.label === "Hora de salida")?.value ??
                            "",
                        }}
                      />
                    ) : (
                      <ProductBookingCard
                        key={`activity-booking-${detail.id}-${searchedDate || "sin-fecha"}`}
                        booking={detail.booking}
                        initialTravelDate={searchedDate}
                        productCoupons={productCouponRecords}
                        productSummary={{
                          id: detail.id,
                          title: detail.title,
                          city: detail.city,
                          departureTime: Array.isArray(detail.meta)
                            ? detail.meta.find(
                                (item) => item.label === "Hora de salida",
                              )?.value ?? ""
                            : "",
                        }}
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
        panelProduct={null}
        productCouponItems={productCouponItems}
        isCouponsLoading={isLoadingCoupons}
        onCouponCreated={() => {
          setCouponRefreshKey((k) => k + 1);
          refreshCoupons();
        }}
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
