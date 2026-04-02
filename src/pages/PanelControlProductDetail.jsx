import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import ProductAdminActionBar from "../components/detalle-producto/ProductAdminActionBar";
import ProductAdminEditableContent from "../components/detalle-producto/ProductAdminEditableContent";
import ProductCouponManager from "../components/detalle-producto/ProductCouponManager";
import ProductGalleryEditor from "../components/detalle-producto/ProductGalleryEditor";
import ProductExcludes from "../components/detalle-producto/ProductExcludes";
import ProductGallery from "../components/detalle-producto/ProductGallery";
import ProductHeroInfo from "../components/detalle-producto/ProductHeroInfo";
import ProductIncludes from "../components/detalle-producto/ProductIncludes";
import ProductItinerary from "../components/detalle-producto/ProductItinerary";
import ProductOverview from "../components/detalle-producto/ProductOverview";
import ProductPriceCard from "../components/detalle-producto/ProductPriceCard";
import ProductRecommendations from "../components/detalle-producto/ProductRecommendations";
import ProductTravelNotes from "../components/detalle-producto/ProductTravelNotes";
import Footer from "../components/resultados/Footer";
import {
  footerData,
} from "../data/panelControlData";
import { toProductCouponItem } from "../data/couponsData";
import {
  getDetalleProducto,
} from "../data/detalleProductoData";
import {
  getAllProductCouponRecords,
} from "../utils/productCouponsStorage";
import { getPanelProductItemById } from "../utils/panelControlProducts";
import {
  getResolvedProductStatus,
  persistProductStatus,
} from "../utils/productStatusStorage";
import { useProductEditor } from "../hooks/useProductEditor";

const MODAL_MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function formatModalDate(monthDay) {
  if (!monthDay) return "";
  const [month, day] = monthDay.split("-");
  const mIndex = Number(month) - 1;
  return `${Number(day)} de ${MODAL_MONTH_NAMES[mIndex]}`;
}

export default function PanelControlProductDetailPage() {
  const { productId } = useParams();
  const detail = getDetalleProducto(productId);
  const panelProduct = getPanelProductItemById(productId);
  const [productStatus, setProductStatus] = useState(() =>
    getResolvedProductStatus(detail.id, detail.status),
  );
  
  const couponManagerRef = useRef(null);
  const [couponRefreshKey, setCouponRefreshKey] = useState(0);

  const [isDisableConfirmationOpen, setIsDisableConfirmationOpen] = useState(false);
  const [isEnableNoticeOpen, setIsEnableNoticeOpen] = useState(false);
  const [isSeasonDatesModalOpen, setIsSeasonDatesModalOpen] = useState(false);
  const {
    isEditingProduct,
    gallerySlots,
    selectedGallerySlot,
    contentDraft,
    activeContentBlock,
    galleryEditorMessage,
    galleryEditorMessageType,
    openEditProductMode,
    closeEditProductMode,
    updateContentListField,
    updateContentObjectListField,
    addContentListField,
    removeContentListField,
    addContentObjectItem,
    removeContentObjectItem,
    updateBookingBasePrice,
    updateBookingGridPrice,
    updateHighSeasonPeriod,
    addHighSeasonPeriod,
    removeHighSeasonPeriod,
    handleRemoveGallerySlot,
    handleChooseGalleryFile,
    handleSaveGallery,
    setContentDraft,
    setSelectedGallerySlot,
    setActiveContentBlock,
  } = useProductEditor(detail);
  const isInactive = productStatus === "inactive";
  
  const productCouponItems = useMemo(
    () =>
      getAllProductCouponRecords()
        .filter((coupon) => coupon.productId === detail.id)
        .map(toProductCouponItem),
    [detail.id, couponRefreshKey],
  );
  const productCouponCount = useMemo(
    () => productCouponItems.length,
    [productCouponItems],
  );

  const detailWithStatus = useMemo(
    () => ({
      ...detail,
      status: productStatus,
    }),
    [detail, productStatus],
  );

  useEffect(() => {
    setProductStatus(getResolvedProductStatus(detail.id, detail.status));
  }, [detail.id, detail.status]);



  useEffect(() => {
    if (
      !isDisableConfirmationOpen &&
      !isEnableNoticeOpen &&
      !isSeasonDatesModalOpen
    ) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsDisableConfirmationOpen(false);
        setIsEnableNoticeOpen(false);
        setIsSeasonDatesModalOpen(false);
        couponManagerRef.current?.closeAll();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    isDisableConfirmationOpen,
    isEnableNoticeOpen,
    isSeasonDatesModalOpen,
  ]);



  function openCouponModal() {
    couponManagerRef.current?.openCreateModal();
  }

  function openCouponsModal() {
    couponManagerRef.current?.openListModal();
  }

  function openDisableConfirmation() {
    setIsDisableConfirmationOpen(true);
  }

  function closeDisableConfirmation() {
    setIsDisableConfirmationOpen(false);
  }

  function closeEnableNotice() {
    setIsEnableNoticeOpen(false);
  }

  function openSeasonDatesModal() {
    setIsSeasonDatesModalOpen(true);
  }

  function closeSeasonDatesModal() {
    setIsSeasonDatesModalOpen(false);
  }



  function applyProductStatus(nextStatus) {
    persistProductStatus(detail.id, nextStatus);
    setProductStatus(nextStatus);
  }

  function confirmDisableProduct() {
    applyProductStatus("inactive");
    closeDisableConfirmation();
  }

  function handleToggleStatus() {
    if (isInactive) {
      applyProductStatus("active");
      setIsEnableNoticeOpen(true);
      return;
    }

    openDisableConfirmation();
  }

  return (
    <div className="detalle-producto-page detalle-producto-page--admin">
      <PrimaryHeader />

      <main className="detalle-producto-main">
        <div className="detalle-producto-admin-sticky-shell">
          <div className="detalle-producto-admin-sticky-wrap">
            <ProductAdminActionBar
              productId={detail.id}
              couponCount={productCouponCount}
              isInactive={isInactive}
              isEditing={isEditingProduct}
              onCreateCoupon={openCouponModal}
              onViewCoupons={openCouponsModal}
              onToggleStatus={handleToggleStatus}
              onEdit={openEditProductMode}
              onSaveEdit={handleSaveGallery}
              onCancelEdit={closeEditProductMode}
              onViewSeasonDates={openSeasonDatesModal}
            />
          </div>
        </div>

        <div className="detalle-producto-shell">
          <div
            className={`detalle-producto-gallery-wrap${
              isEditingProduct ? " detalle-producto-gallery-wrap--editing" : ""
            }`}
          >
            {isEditingProduct ? (
              <ProductGalleryEditor
                productName={detail.title}
                slots={gallerySlots}
                selectedSlot={selectedGallerySlot}
                message={galleryEditorMessage}
                messageType={galleryEditorMessageType}
                onSelectSlot={setSelectedGallerySlot}
                onChooseFile={handleChooseGalleryFile}
                onRemoveSlot={handleRemoveGallerySlot}
              />
            ) : (
              <ProductGallery
                images={detail.galleryImages}
                title={detailWithStatus.title}
              />
            )}
          </div>

          <div className="detalle-producto-content-wrap">
            <div className="detalle-producto-layout">
              <div className="detalle-producto-content">
                {isEditingProduct ? (
                  <ProductAdminEditableContent
                    detail={detailWithStatus}
                    draft={contentDraft}
                    activeBlock={activeContentBlock}
                    onActivateBlock={setActiveContentBlock}
                    onTitleChange={(nextValue) =>
                      setContentDraft((current) => ({
                        ...current,
                        title: nextValue,
                      }))
                    }
                    onSummaryChange={(nextValue) =>
                      setContentDraft((current) => ({
                        ...current,
                        summary: nextValue,
                      }))
                    }
                    onOverviewChange={(index, nextValue) =>
                      updateContentListField("overview", index, nextValue)
                    }
                    onItineraryChange={(index, key, nextValue) =>
                      updateContentObjectListField(
                        "itinerary",
                        index,
                        key,
                        nextValue,
                      )
                    }
                    onIncludesChange={(index, key, nextValue) =>
                      updateContentObjectListField(
                        "includes",
                        index,
                        key,
                        nextValue,
                      )
                    }
                    onExcludesChange={(index, key, nextValue) =>
                      updateContentObjectListField(
                        "excludes",
                        index,
                        key,
                        nextValue,
                      )
                    }
                    onRecommendationsChange={(index, nextValue) =>
                      updateContentListField("recommendations", index, nextValue)
                    }
                    onConsiderationsChange={(index, nextValue) =>
                      updateContentListField("considerations", index, nextValue)
                    }
                    onCancellationPolicyChange={(index, nextValue) =>
                      updateContentListField(
                        "cancellationPolicies",
                        index,
                        nextValue,
                      )
                    }
                    onAddItineraryItem={() =>
                      addContentObjectItem("itinerary", "itinerary", {
                        day: "Nueva parada",
                        title: "",
                        description: "",
                      })
                    }
                    onRemoveItineraryItem={(index) =>
                      removeContentObjectItem("itinerary", index)
                    }
                    onAddIncludeItem={() =>
                      addContentObjectItem("includes", "include", {
                        title: "",
                        description: "",
                      })
                    }
                    onRemoveIncludeItem={(index) =>
                      removeContentObjectItem("includes", index)
                    }
                    onAddExcludeItem={() =>
                      addContentObjectItem("excludes", "exclude", {
                        title: "",
                        description: "",
                      })
                    }
                    onRemoveExcludeItem={(index) =>
                      removeContentObjectItem("excludes", index)
                    }
                    onAddRecommendationItem={() =>
                      addContentListField("recommendations", "")
                    }
                    onRemoveRecommendationItem={(index) =>
                      removeContentListField("recommendations", index)
                    }
                    onAddConsiderationItem={() =>
                      addContentListField("considerations", "")
                    }
                    onRemoveConsiderationItem={(index) =>
                      removeContentListField("considerations", index)
                    }
                    onAddCancellationPolicyItem={() =>
                      addContentListField("cancellationPolicies", "")
                    }
                    onRemoveCancellationPolicyItem={(index) =>
                      removeContentListField("cancellationPolicies", index)
                    }
                  />
                ) : (
                  <>
                    <ProductHeroInfo detail={detailWithStatus} showBadges={false} />

                    <ProductOverview paragraphs={detail.overview} />
                    <ProductItinerary items={detail.itinerary} />
                    <ProductIncludes items={detail.includes} />
                    <ProductExcludes items={detail.excludes} />
                    <ProductRecommendations items={detail.recommendations} />
                    <ProductTravelNotes
                      considerations={detail.considerations}
                      cancellationPolicies={detail.cancellationPolicies}
                    />
                  </>
                )}
              </div>

              <div className="detalle-producto-sidebar">
                <ProductPriceCard
                  booking={isEditingProduct ? contentDraft.booking : detail.booking}
                  status={productStatus}
                  isEditingEnabled={isEditingProduct}
                  activeBlock={activeContentBlock}
                  onActivateBlock={setActiveContentBlock}
                  onBasePriceChange={updateBookingBasePrice}
                  onGridPriceChange={updateBookingGridPrice}
                  onHighSeasonPeriodChange={updateHighSeasonPeriod}
                  onAddHighSeasonPeriod={addHighSeasonPeriod}
                  onRemoveHighSeasonPeriod={removeHighSeasonPeriod}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer data={footerData} />

      <ProductCouponManager
        ref={couponManagerRef}
        productName={detailWithStatus.title}
        productImage={detail.galleryImages[0] ?? "/images/home/1.jpg"}
        panelProduct={panelProduct}
        productCouponItems={productCouponItems}
        onCouponCreated={() => setCouponRefreshKey((k) => k + 1)}
      />

      {isDisableConfirmationOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeDisableConfirmation}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-producto-disable-modal-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeDisableConfirmation}
              aria-label="Cerrar confirmacion de inhabilitacion"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Confirmacion de estado</p>
            <h3 id="detalle-producto-disable-modal-title">Inhabilitar producto</h3>
            <span>
              {"Estas de acuerdo en inhabilitar: "}
              <strong className="detalle-producto-admin-modal-product-name">
                {`${detailWithStatus.title}?`}
              </strong>
              <br />
              {" El producto dejara de verse como activo dentro del panel hasta que vuelvas a habilitarlo."}
            </span>

            <div className="detalle-producto-admin-modal-actions">
              <button
                type="button"
                className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                onClick={closeDisableConfirmation}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--danger"
                onClick={confirmDisableProduct}
              >
                Si, inhabilitar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEnableNoticeOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeEnableNotice}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-producto-enable-modal-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeEnableNotice}
              aria-label="Cerrar notificacion de activacion"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Estado actualizado</p>
            <h3 id="detalle-producto-enable-modal-title">Producto activado</h3>
            <span>
              El producto vuelve a estar habilitado y disponible dentro del panel de
              control y en las vistas publicas.
            </span>

            <button
              type="button"
              className="detalle-producto-admin-modal-button"
              onClick={closeEnableNotice}
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}

      {isSeasonDatesModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeSeasonDatesModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-producto-season-modal-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeSeasonDatesModal}
              aria-label="Cerrar fechas de temporada"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Informacion operativa</p>
            <h3 id="detalle-producto-season-modal-title">Fechas de Temporada Alta</h3>
            <span>
              {detail.booking?.pricingDetails?.seasons?.high?.periods?.length > 0
                ? "Los siguientes periodos se consideran temporada alta para este producto:"
                : "Este producto no tiene periodos de temporada alta configurados."}
            </span>

            {detail.booking?.pricingDetails?.seasons?.high?.periods?.length > 0 ? (
              <div style={{ display: "grid", gap: "0.8rem", marginTop: "1.5rem", marginBottom: "0.8rem" }}>
                {detail.booking.pricingDetails.seasons.high.periods.map((period) => (
                  <div key={period.id} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "#f8fbfc", padding: "1rem 1.2rem", borderRadius: "1rem", border: "1px solid rgba(15, 118, 110, 0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "3rem", height: "3rem", backgroundColor: "#e2f2e9", color: "var(--lds-logo-green-dark)", borderRadius: "50%" }}>
                      <span className="material-icons-outlined" style={{ fontSize: "1.45rem" }}>event_available</span>
                    </div>
                    <div style={{ display: "grid", gap: "0.15rem", textAlign: "left" }}>
                      <strong style={{ color: "var(--on-surface)", fontSize: "0.92rem", lineHeight: "1.2" }}>{period.label || "Periodo de Temporada"}</strong>
                      <span style={{ color: "var(--tertiary)", fontSize: "0.78rem", fontWeight: "600" }}>
                        Del {formatModalDate(period.startMonthDay)} al {formatModalDate(period.endMonthDay)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              className="detalle-producto-admin-modal-button"
              onClick={closeSeasonDatesModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
