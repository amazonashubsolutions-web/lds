import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LoadingState from "../components/common/LoadingState";
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
import ProductTransportPriceCard from "../components/detalle-producto/ProductTransportPriceCard";
import ProductRestaurantPriceCard from "../components/detalle-producto/ProductRestaurantPriceCard";
import ProductPlanPriceCard from "../components/detalle-producto/ProductPlanPriceCard";
import ProductExcursionPriceCard from "../components/detalle-producto/ProductExcursionPriceCard";
import ProductRecommendations from "../components/detalle-producto/ProductRecommendations";
import ProductTravelNotes from "../components/detalle-producto/ProductTravelNotes";
import ProductKeywordCloud from "../components/detalle-producto/ProductKeywordCloud";
import ProductGroupCapacityModal from "../components/detalle-producto/ProductGroupCapacityModal";
import ProductSeasonDatesModal from "../components/detalle-producto/ProductSeasonDatesModal";
import Footer from "../components/resultados/Footer";
import { usePanelSession } from "../contexts/PanelSessionContext";
import {
  footerData,
} from "../data/panelControlData";
import { toProductCouponItem } from "../data/couponsData";
import { useProductEditor } from "../hooks/useProductEditor";
import { fetchAdminProductDetailFromSupabase } from "../services/products/adminCatalog";
import {
  createProductDisableCaseInSupabase,
  fetchProductDisableImpactFromSupabase,
  updateProductStatusInSupabase,
} from "../services/products/adminMutations";
import {
  fetchProductCalendarActivationSnapshotFromSupabase,
  fetchProductActiveRangeHistoryFromSupabase,
  fetchProductGroupCapacitySnapshotFromSupabase,
} from "../services/products/adminCalendar";
import useProductCouponRecords from "../hooks/useProductCouponRecords";

const PRODUCT_DISABLE_REASON_OPTIONS = [
  {
    value: "stop_selling",
    label: "Voy a dejar de vender este producto",
  },
  {
    value: "legal_permits",
    label: "Falta de Permisos o tramites legales de operacion",
  },
  {
    value: "company_closure",
    label: "La empresa no va a continuar operaciones",
  },
  {
    value: "weather",
    label: "Inhabilitacion por temas climaticos",
  },
  {
    value: "other",
    label: "Otros",
  },
];

function formatDateLabel(dateValue) {
  const parsedDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTimeLabel(dateValue) {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function createDisableCaseFormState() {
  return {
    reasonKey: "",
    reasonOther: "",
  };
}


export default function PanelControlProductDetailPage() {
  const { productId } = useParams();
  const { profile } = usePanelSession();
  const [resolvedDetail, setResolvedDetail] = useState(null);
  const [resolvedPanelProduct, setResolvedPanelProduct] = useState(null);
  const [isResolvingDetail, setIsResolvingDetail] = useState(true);
  const [detailLoadError, setDetailLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setResolvedDetail(null);
    setResolvedPanelProduct(null);
    setIsResolvingDetail(true);
    setDetailLoadError("");

    fetchAdminProductDetailFromSupabase(productId)
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setResolvedDetail(payload?.detail ?? null);
        setResolvedPanelProduct(payload?.panelProduct ?? null);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setResolvedDetail(null);
        setResolvedPanelProduct(null);
        setDetailLoadError(
          error?.message ||
            "No fue posible abrir la ficha del producto en Supabase. Revisa la sesion o la conexion e intenta de nuevo.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsResolvingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (isResolvingDetail && !resolvedDetail) {
    return (
      <div className="detalle-producto-page detalle-producto-page--admin">
        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <LoadingState
                className="detail-loading-state"
                title="Estamos abriendo la ficha del panel"
                description="Estamos resolviendo la informacion del producto para mostrarte la version mas actual disponible."
              />
            </div>
          </section>
        </main>

        <Footer data={footerData} />
      </div>
    );
  }

  if (!resolvedDetail) {
    return (
      <div className="detalle-producto-page detalle-producto-page--admin">
        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <p>{detailLoadError ? "No pudimos cargar el producto" : "Producto no encontrado"}</p>
              <h1>No pudimos abrir esta ficha del panel</h1>
              <span>
                {detailLoadError
                  ? detailLoadError
                  : "El producto que buscas no existe en Supabase o ya no tiene una ruta valida dentro del panel de control."}
              </span>
              <Link
                className="detalle-producto-unavailable-button"
                to="/panel-de-control/productos"
              >
                Volver al panel de productos
              </Link>
            </div>
          </section>
        </main>

        <Footer data={footerData} />
      </div>
    );
  }

  return (
    <PanelControlProductDetailResolvedPage
      key={resolvedDetail.id}
      detail={resolvedDetail}
      profile={profile}
      panelProduct={resolvedPanelProduct}
      onDetailSaved={(nextDetail) => {
        setResolvedDetail(nextDetail);
        setResolvedPanelProduct((current) =>
          current
            ? {
                ...current,
                title: nextDetail.title,
                image: nextDetail.galleryImages[0] ?? current.image,
                price: Number(String(nextDetail.booking?.price ?? "0").replace(/\D/g, "")),
              }
            : current,
        );
      }}
    />
  );
}

function PanelControlProductDetailResolvedPage({
  detail,
  profile,
  onDetailSaved,
  panelProduct,
}) {
  const navigate = useNavigate();
  const [productStatusOverrides, setProductStatusOverrides] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activationSnapshot, setActivationSnapshot] = useState(null);
  const [isLoadingActivationSnapshot, setIsLoadingActivationSnapshot] = useState(true);
  const [activeRangeHistory, setActiveRangeHistory] = useState([]);
  const [groupCapacitySnapshot, setGroupCapacitySnapshot] = useState(null);
  const [isLoadingGroupCapacitySnapshot, setIsLoadingGroupCapacitySnapshot] = useState(true);
  
  const couponManagerRef = useRef(null);
  const [, setCouponRefreshKey] = useState(0);

  const [isDisableConfirmationOpen, setIsDisableConfirmationOpen] = useState(false);
  const [disableImpact, setDisableImpact] = useState({ affectedReservationsCount: 0 });
  const [isLoadingDisableImpact, setIsLoadingDisableImpact] = useState(false);
  const [disableCaseForm, setDisableCaseForm] = useState(() =>
    createDisableCaseFormState(),
  );
  const [disableCaseError, setDisableCaseError] = useState("");
  const [disableCaseResult, setDisableCaseResult] = useState(null);
  const [isEnableNoticeOpen, setIsEnableNoticeOpen] = useState(false);
  const [isGroupCapacityModalOpen, setIsGroupCapacityModalOpen] = useState(false);
  const [isSeasonDatesModalOpen, setIsSeasonDatesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const {
    isEditingProduct,
    gallerySlots,
    selectedGallerySlot,
    contentDraft,
    activeContentBlock,
    galleryEditorMessage,
    galleryEditorMessageType,
    isSavingProduct,
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
  } = useProductEditor(detail, {
    onSaveSuccess: onDetailSaved,
  });
  const productStatus = productStatusOverrides[detail.id] ?? detail.status;
  const isInactive = productStatus === "inactive";
  const isSuperUser = profile?.role === "super_user";
  const isProviderTravelAgent =
    profile?.role === "travel_agent" &&
    profile?.agency?.agency_type === "provider";
  const canManageProductActions =
    profile?.role === "super_user" || profile?.role === "agency_admin";
  const canViewProviderReadOnlyActions = canManageProductActions || isProviderTravelAgent;
  const hasAnyActiveRange = Boolean(activationSnapshot?.hasAnyActiveRange);
  const shouldOpenInitialActivationFlow = isInactive && !hasAnyActiveRange;
  const canSuperUserReactivate = isInactive && hasAnyActiveRange && isSuperUser;
  const showStatusAction =
    !isInactive ||
    (!isLoadingActivationSnapshot &&
      (shouldOpenInitialActivationFlow || canSuperUserReactivate));
  const statusActionLabel = isInactive ? "Habilitar" : "Inhabilitar";
  const statusActionIconName = isInactive
    ? "published_with_changes"
    : "block";
  
  const {
    couponRecords: productCouponRecords,
    isLoadingCoupons,
    refreshCoupons,
  } = useProductCouponRecords({
    productId: detail.id,
  });
  const productCouponItems = productCouponRecords.map(toProductCouponItem);
  const productCouponCount = productCouponItems.length;

  const detailWithStatus = useMemo(
    () => ({
      ...detail,
      status: productStatus,
    }),
    [detail, productStatus],
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoadingActivationSnapshot(true);
    setIsLoadingGroupCapacitySnapshot(true);

    Promise.allSettled([
      fetchProductCalendarActivationSnapshotFromSupabase(detail.id),
      fetchProductActiveRangeHistoryFromSupabase(detail.id),
      fetchProductGroupCapacitySnapshotFromSupabase(detail.id),
    ]).then(([activationResult, historyResult, capacityResult]) => {
      if (!isMounted) {
        return;
      }

      setActivationSnapshot(
        activationResult.status === "fulfilled" ? activationResult.value : null,
      );
      setActiveRangeHistory(
        historyResult.status === "fulfilled" ? historyResult.value : [],
      );
      setGroupCapacitySnapshot(
        capacityResult.status === "fulfilled" ? capacityResult.value : null,
      );
      setIsLoadingActivationSnapshot(false);
      setIsLoadingGroupCapacitySnapshot(false);
    });

    return () => {
      isMounted = false;
    };
  }, [detail.id]);

  useEffect(() => {
    let isMounted = true;

    if (!isDisableConfirmationOpen) {
      return undefined;
    }

    setIsLoadingDisableImpact(true);
    setDisableCaseError("");

    fetchProductDisableImpactFromSupabase(detail.id)
      .then((impact) => {
        if (isMounted) {
          setDisableImpact(impact);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setDisableImpact({ affectedReservationsCount: 0 });
          setDisableCaseError(
            error?.message ||
              "No fue posible consultar las reservas afectadas por la inhabilitacion.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDisableImpact(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [detail.id, isDisableConfirmationOpen]);

  useEffect(() => {
    if (
      !isDisableConfirmationOpen &&
      !disableCaseResult &&
      !isEnableNoticeOpen &&
      !isGroupCapacityModalOpen &&
      !isSeasonDatesModalOpen &&
      !isHistoryModalOpen
    ) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsDisableConfirmationOpen(false);
        setDisableCaseResult(null);
        setIsEnableNoticeOpen(false);
        setIsGroupCapacityModalOpen(false);
        setIsSeasonDatesModalOpen(false);
        setIsHistoryModalOpen(false);
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
    disableCaseResult,
    isEnableNoticeOpen,
    isGroupCapacityModalOpen,
    isSeasonDatesModalOpen,
    isHistoryModalOpen,
  ]);



  function openCouponModal() {
    couponManagerRef.current?.openCreateModal();
  }

  function openCouponsModal() {
    couponManagerRef.current?.openListModal();
  }

  function openDisableConfirmation() {
    setDisableCaseForm(createDisableCaseFormState());
    setDisableCaseError("");
    setDisableImpact({ affectedReservationsCount: 0 });
    setIsDisableConfirmationOpen(true);
  }

  function closeDisableConfirmation() {
    if (isUpdatingStatus) {
      return;
    }

    setIsDisableConfirmationOpen(false);
  }

  function closeDisableCaseResult() {
    setDisableCaseResult(null);
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

  function openGroupCapacityModal() {
    setIsGroupCapacityModalOpen(true);
  }

  function closeGroupCapacityModal() {
    setIsGroupCapacityModalOpen(false);
  }

  function openHistoryModal() {
    setIsHistoryModalOpen(true);
  }

  function closeHistoryModal() {
    setIsHistoryModalOpen(false);
  }



  async function applyProductStatus(nextStatus) {
    try {
      setIsUpdatingStatus(true);
      const savedStatus = await updateProductStatusInSupabase(detail.id, nextStatus);
      const nextActivationSnapshot =
        await fetchProductCalendarActivationSnapshotFromSupabase(detail.id);

      setProductStatusOverrides((current) => ({
        ...current,
        [detail.id]: savedStatus,
      }));
      setActivationSnapshot(nextActivationSnapshot);

      return savedStatus;
    } catch (error) {
      window.alert(
        error.message ||
          "No fue posible actualizar el estado del producto en Supabase.",
      );

      return null;
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function confirmDisableProduct() {
    if (!disableCaseForm.reasonKey) {
      setDisableCaseError("Selecciona el motivo de la inhabilitacion.");
      return;
    }

    if (
      disableCaseForm.reasonKey === "other" &&
      !disableCaseForm.reasonOther.trim()
    ) {
      setDisableCaseError("Describe el motivo cuando eliges la opcion Otros.");
      return;
    }

    try {
      setDisableCaseError("");
      setIsUpdatingStatus(true);
      const createdCase = await createProductDisableCaseInSupabase({
        productId: detail.id,
        reasonKey: disableCaseForm.reasonKey,
        reasonOther: disableCaseForm.reasonOther,
      });
      const nextActivationSnapshot =
        await fetchProductCalendarActivationSnapshotFromSupabase(detail.id);

      setProductStatusOverrides((current) => ({
        ...current,
        [detail.id]: "inactive",
      }));
      setActivationSnapshot(nextActivationSnapshot);
      setIsDisableConfirmationOpen(false);
      setDisableCaseResult(createdCase);

      if (createdCase.mailtoUrl && typeof window !== "undefined") {
        window.location.href = createdCase.mailtoUrl;
      }
    } catch (error) {
      setDisableCaseError(
        error?.message ||
          "No fue posible crear el caso de inhabilitacion del producto.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleToggleStatus() {
    if (isInactive) {
      if (shouldOpenInitialActivationFlow) {
        navigate(`/panel-de-control/productos/${detail.id}/calendario?activation=1`);
        return;
      }

      if (!canSuperUserReactivate) {
        return;
      }

      const savedStatus = await applyProductStatus("active");

      if (savedStatus === "active") {
        setIsEnableNoticeOpen(true);
      }

      return;
    }

    openDisableConfirmation();
  }


  return (
    <div
      className="detalle-producto-page detalle-producto-page--admin"
      style={{ "--detalle-admin-header-offset": "0px" }}
    >
      <main className="detalle-producto-main">
        <div className="detalle-producto-admin-sticky-shell" style={{ paddingTop: '0' }}>
          <div className="detalle-producto-admin-sticky-wrap">
            <ProductAdminActionBar
              couponCount={productCouponCount}
              canManageProductActions={canManageProductActions}
              canViewProviderReadOnlyActions={canViewProviderReadOnlyActions}
              isInactive={isInactive}
              isEditing={isEditingProduct}
              onViewCapacityConfig={openGroupCapacityModal}
              onViewHistory={openHistoryModal}
              onCreateCoupon={openCouponModal}
              onViewCoupons={openCouponsModal}
              onToggleStatus={handleToggleStatus}
              onEdit={openEditProductMode}
              onSaveEdit={handleSaveGallery}
              onCancelEdit={closeEditProductMode}
              onViewSeasonDates={openSeasonDatesModal}
              isSavingEdit={isSavingProduct}
              isUpdatingStatus={isUpdatingStatus}
              isLoadingCoupons={isLoadingCoupons}
              statusActionLabel={statusActionLabel}
              statusActionIconName={statusActionIconName}
              showStatusAction={showStatusAction}
              isStatusActionDisabled={isInactive && isLoadingActivationSnapshot}
            />
          </div>
        </div>

        <div className="detalle-producto-shell">
          {activationSnapshot ? (
            <section
              className={`panel-control-card panel-control-calendar-activation-banner panel-control-calendar-activation-banner--${activationSnapshot.tone}`}
            >
              <div className="panel-control-calendar-activation-banner-copy">
                <span>Estado Operativo</span>
                <strong className="panel-control-product-operational-state-title">
                  <span
                    className={`panel-control-product-ranges-history-dot panel-control-product-ranges-history-dot--${
                      activationSnapshot.productStatus === "active"
                        ? "active"
                        : "inactive"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{activationSnapshot.title}</span>
                </strong>
                <p>{activationSnapshot.description}</p>
              </div>

              <div className="panel-control-calendar-activation-banner-actions">
                {activationSnapshot.nextActiveRange?.fecha_inicio ? (
                  <small>
                    Proxima ventana:{" "}
                    {formatDateLabel(activationSnapshot.nextActiveRange.fecha_inicio)} al{" "}
                    {formatDateLabel(activationSnapshot.nextActiveRange.fecha_fin)}
                  </small>
                ) : null}

                <button
                  type="button"
                  className="panel-control-products-create"
                  onClick={() =>
                    navigate(`/panel-de-control/productos/${detail.id}/calendario`)
                  }
                >
                  Revisar calendario
                </button>
              </div>
            </section>
          ) : null}

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
                    <ProductKeywordCloud detail={detail} />
                  </>
                )}
              </div>

              <div className="detalle-producto-sidebar">
                {detail.categoryId === "transporte" || (isEditingProduct && contentDraft?.categoryId === "transporte") ? (
                  <ProductTransportPriceCard
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
                ) : detail.categoryId === "restaurantes" || (isEditingProduct && contentDraft?.categoryId === "restaurantes") ? (
                  <ProductRestaurantPriceCard
                    draft={isEditingProduct ? contentDraft : { booking: detail.booking }}
                    status={productStatus}
                    isEditingEnabled={isEditingProduct}
                    activeBlock={activeContentBlock}
                    onActivateBlock={setActiveContentBlock}
                    onBasePriceChange={updateBookingBasePrice}
                    onGridPriceChange={updateBookingGridPrice}
                    onUpdatePeriod={updateHighSeasonPeriod}
                    onAddPeriod={addHighSeasonPeriod}
                    onRemovePeriod={removeHighSeasonPeriod}
                  />
                ) : detail.categoryId === "excursiones" || (isEditingProduct && contentDraft?.categoryId === "excursiones") ? (
                  <ProductExcursionPriceCard
                    draft={{
                      ...(isEditingProduct ? contentDraft : { booking: detail.booking }),
                      subcategoryIds: panelProduct?.subcategoryIds ?? [],
                    }}
                    isEditingEnabled={isEditingProduct}
                    activeBlock={activeContentBlock}
                    onActivateBlock={setActiveContentBlock}
                    onBasePriceChange={updateBookingBasePrice}
                    onGridPriceChange={updateBookingGridPrice}
                    onUpdatePeriod={updateHighSeasonPeriod}
                    onAddPeriod={addHighSeasonPeriod}
                    onRemovePeriod={removeHighSeasonPeriod}
                  />
                ) : (detail.categoryId === "planes" || (isEditingProduct && contentDraft?.categoryId === "planes")) ? (
                  <ProductPlanPriceCard
                    draft={isEditingProduct ? contentDraft : { booking: detail.booking }}
                    isEditingEnabled={isEditingProduct}
                    activeBlock={activeContentBlock}
                    onActivateBlock={setActiveContentBlock}
                    onBasePriceChange={updateBookingBasePrice}
                    onGridPriceChange={updateBookingGridPrice}
                    onUpdatePeriod={updateHighSeasonPeriod}
                    onAddPeriod={addHighSeasonPeriod}
                    onRemovePeriod={removeHighSeasonPeriod}
                  />
                ) : (
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
                )}
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
        isCouponsLoading={isLoadingCoupons}
        onCouponCreated={() => {
          setCouponRefreshKey((k) => k + 1);
          refreshCoupons();
        }}
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

            <p>Caso critico de producto</p>
            <h3 id="detalle-producto-disable-modal-title">Inhabilitar producto</h3>
            <span className="detalle-producto-admin-modal-span">
              {`Esta seguro que desea inhabilitar el producto ${detailWithStatus.title}?`}
            </span>

            <div className="detalle-producto-disable-impact-box">
              <strong>Reservas afectadas desde hoy</strong>
              <p>
                {isLoadingDisableImpact
                  ? "Estamos calculando las reservas compradas y confirmadas que se veran afectadas."
                  : `Van a ser afectadas ${disableImpact.affectedReservationsCount} reservas confirmadas que estan compradas y confirmadas para los pasajeros.`}
              </p>
            </div>

            <label className="detalle-producto-disable-field">
              <span>Motivo</span>
              <select
                value={disableCaseForm.reasonKey}
                onChange={(event) =>
                  setDisableCaseForm((current) => ({
                    ...current,
                    reasonKey: event.target.value,
                    reasonOther:
                      event.target.value === "other" ? current.reasonOther : "",
                  }))
                }
                disabled={isUpdatingStatus}
              >
                <option value="">Selecciona un motivo</option>
                {PRODUCT_DISABLE_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {disableCaseForm.reasonKey === "other" ? (
              <label className="detalle-producto-disable-field">
                <span>Motivo adicional</span>
                <textarea
                  value={disableCaseForm.reasonOther}
                  onChange={(event) =>
                    setDisableCaseForm((current) => ({
                      ...current,
                      reasonOther: event.target.value,
                    }))
                  }
                  placeholder="Explica el motivo de la inhabilitacion"
                  disabled={isUpdatingStatus}
                />
              </label>
            ) : null}

            {disableCaseError ? (
              <p className="panel-control-calendar-modal-error">{disableCaseError}</p>
            ) : null}

            <div className="detalle-producto-admin-modal-actions">
              <button
                type="button"
                className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                onClick={closeDisableConfirmation}
                disabled={isUpdatingStatus}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--danger"
                onClick={confirmDisableProduct}
                disabled={isUpdatingStatus || isLoadingDisableImpact}
              >
                <span className="lds-button-content">
                  {isUpdatingStatus ? (
                    <LoadingSpinner label="Creando caso de inhabilitacion" size="sm" />
                  ) : null}
                  <span>{isUpdatingStatus ? "Creando caso..." : "Aceptar"}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {disableCaseResult ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeDisableCaseResult}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-producto-disable-case-result-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeDisableCaseResult}
              aria-label="Cerrar confirmacion del caso"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Caso creado</p>
            <h3 id="detalle-producto-disable-case-result-title">
              Caso de inhabilitacion registrado
            </h3>
            <span className="detalle-producto-admin-modal-span">
              El producto deja de venderse y queda bloqueado para ventas futuras.
            </span>

            <div className="detalle-producto-disable-impact-box">
              <strong>Resumen del caso</strong>
              <p>
                Registramos el caso para {disableCaseResult.productName} con motivo{" "}
                <strong>{disableCaseResult.reasonLabel}</strong>.
              </p>
              <p>
                Reservas afectadas detectadas:{" "}
                <strong>{disableCaseResult.affectedReservationsCount}</strong>.
              </p>
            </div>

            <div className="detalle-producto-disable-impact-box detalle-producto-disable-impact-box--soft">
              <strong>Siguiente paso</strong>
              <p>
                LDS y la agencia proveedora deben revisar el caso para definir los
                flujos de reembolso o reacomodacion con los clientes afectados.
              </p>
              <p>
                Debes esperar confirmacion por parte de LDS para finalizar la
                inhabilitacion del producto, ya que se trata de un tema critico
                de vida del producto.
              </p>
            </div>

            <div className="detalle-producto-admin-modal-actions">
              <button
                type="button"
                className="detalle-producto-admin-modal-button"
                onClick={closeDisableCaseResult}
              >
                Entendido
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
        <ProductSeasonDatesModal
          periods={detail.booking?.pricingDetails?.seasons?.high?.periods}
          onClose={closeSeasonDatesModal}
        />
      ) : null}

      {isGroupCapacityModalOpen ? (
        <ProductGroupCapacityModal
          productId={detail.id}
          productName={detailWithStatus.title}
          activationSnapshot={activationSnapshot}
          groupCapacitySnapshot={groupCapacitySnapshot}
          isLoadingGroupCapacitySnapshot={isLoadingGroupCapacitySnapshot}
          isProductInactive={isInactive}
          onClose={closeGroupCapacityModal}
        />
      ) : null}

      {isHistoryModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeHistoryModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal detalle-producto-admin-modal--history"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-producto-history-modal-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeHistoryModal}
              aria-label="Cerrar historial del producto"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Bitacora operativa</p>
            <h3 id="detalle-producto-history-modal-title">Historial del producto</h3>

            {activeRangeHistory.length === 0 ? (
              <div className="panel-control-reservations-empty">
                <strong>Aun no hay movimientos registrados.</strong>
                <p>
                  Cuando el producto tenga activaciones o inhabilitaciones, LDS
                  dejara aqui el historico operativo.
                </p>
              </div>
            ) : (
              <div className="detalle-producto-history-modal-body">
                <div className="panel-control-calendar-history-list panel-control-calendar-history-list--horizontal">
                  <div className="panel-control-calendar-history-table-head panel-control-product-ranges-history-head">
                    <span>Movimiento</span>
                    <span>Detalle</span>
                    <span>Usuario</span>
                    <span>Fecha Movimiento</span>
                  </div>

                  {activeRangeHistory.map((range) => (
                    <article
                      className="panel-control-calendar-history-card panel-control-product-ranges-history-row"
                      key={range.id}
                    >
                      <div className="panel-control-calendar-history-card-head">
                        <strong className="panel-control-product-ranges-history-title">
                          <span
                            className={`panel-control-product-ranges-history-dot panel-control-product-ranges-history-dot--${
                              range.entryType === "disable_case"
                                ? "inactive"
                                : "active"
                            }`}
                            aria-hidden="true"
                          />
                          <span>{range.title}</span>
                        </strong>
                        <small>
                          {range.entryType === "disable_case"
                            ? "Caso critico"
                            : "Activacion operativa"}
                        </small>
                      </div>

                      <div className="panel-control-product-ranges-history-detail">
                        <strong>{range.detail}</strong>
                        <small>{range.secondaryDetail}</small>
                      </div>

                      <span className="panel-control-product-ranges-history-user">
                        {range.actorName || "Usuario no disponible"}
                      </span>

                      <time dateTime={range.createdAt}>
                        {formatDateTimeLabel(range.createdAt)}
                      </time>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}




