import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductCreateEditorContent from "../components/panel-control/ProductCreateEditorContent";
import ProductCreateFormErrorToast from "../components/panel-control/ProductCreateFormErrorToast";
import ProductCreateSidebar from "../components/panel-control/ProductCreateSidebar";
import ProductExcursionMagicAiModal from "../components/detalle-producto/ProductExcursionMagicAiModal";
import ProductGalleryEditor from "../components/detalle-producto/ProductGalleryEditor";
import ProductMagicAiModal from "../components/detalle-producto/ProductMagicAiModal";
import ProductPlanMagicAiModal from "../components/detalle-producto/ProductPlanMagicAiModal";
import ProductTransportMagicAiModal from "../components/detalle-producto/ProductTransportMagicAiModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PrimaryHeader from "../components/layout/PrimaryHeader";
import ProductRestaurantMagicAiModal from "../components/modals/ProductRestaurantMagicAiModal";
import Footer from "../components/resultados/Footer";
import { usePanelSession } from "../contexts/PanelSessionContext";
import { footerData } from "../data/panelControlData";
import { productCategories } from "../data/productsData";
import useProductCreateForm from "../hooks/useProductCreateForm";
import {
  buildActivityDraftFromAi,
  buildExcursionDraftFromAi,
  buildPlanDraftFromAi,
  buildRestaurantDraftFromAi,
  buildTransportDraftFromAi,
} from "../utils/productCreateAiMappers";
import { mapWizardImagesToGallerySlots } from "../utils/productCreateDraft";

export default function PanelControlProductCreatePage() {
  const navigate = useNavigate();
  const { profile, isProfileLoading } = usePanelSession();
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(true);
  const [isTransportMagicModalOpen, setIsTransportMagicModalOpen] = useState(false);
  const [isRestaurantMagicModalOpen, setIsRestaurantMagicModalOpen] = useState(false);
  const [isPlanMagicModalOpen, setIsPlanMagicModalOpen] = useState(false);
  const [isExcursionMagicModalOpen, setIsExcursionMagicModalOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState(null);
  const {
    activeBlock,
    addHighSeasonPeriod,
    addObjectListItem,
    addStringListItem,
    availableSubcategories,
    bookingForSidebar,
    closeCreationSuccess,
    createdProductInfo,
    draft,
    formError,
    galleryMessage,
    galleryMessageType,
    gallerySlots,
    handleCancel,
    handleChooseGalleryFile,
    handleGeneralFieldChange,
    handleRemoveGallerySlot,
    handleSaveProduct,
    removeHighSeasonPeriod,
    removeObjectListItem,
    removeStringListItem,
    requiresActivityTimes,
    isSavingProduct,
    selectedGallerySlot,
    setActiveBlock,
    setDraft,
    setFormError,
    setGallerySlots,
    setSelectedGallerySlot,
    updateBookingBasePrice,
    updateBookingGridPrice,
    updateHighSeasonPeriod,
    updateObjectListField,
    updateStringListField,
  } = useProductCreateForm({
    onCancelNavigate: () => navigate("/panel-de-control/productos"),
    onSuccessNavigate: (productId) =>
      navigate(`/panel-de-control/productos/${productId}`, { replace: true }),
  });
  const canCreateProducts =
    profile?.role === "super_user" || profile?.role === "agency_admin";

  if (isProfileLoading) {
    return (
      <div className="detalle-producto-page detalle-producto-page--admin">
        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <LoadingSpinner label="Validando permisos" size="lg" />
            </div>
          </section>
        </main>

        <Footer data={footerData} />
      </div>
    );
  }

  if (!canCreateProducts) {
    return (
      <div className="detalle-producto-page detalle-producto-page--admin">
        <PrimaryHeader />

        <main className="detalle-producto-main">
          <section className="detalle-producto-unavailable">
            <div className="detalle-producto-unavailable-card">
              <p>Accion no disponible</p>
              <h1>No tienes permisos para crear productos</h1>
              <span>
                Solo un admin de agencia proveedora o un super user de LDS puede
                crear productos en el panel de control.
              </span>
              <button
                type="button"
                className="detalle-producto-unavailable-button"
                onClick={() => navigate("/panel-de-control/productos")}
              >
                Volver a productos
              </button>
            </div>
          </section>
        </main>

        <Footer data={footerData} />
      </div>
    );
  }

  function applyWizardImages(images) {
    if (!Array.isArray(images) || images.length === 0) {
      return;
    }

    setGallerySlots((current) => mapWizardImagesToGallerySlots(current, images));
  }

  function handleMagicGenerate(category, payload = {}) {
    try {
      if (!payload.aiData) {
        return;
      }

      applyWizardImages(payload.images);
      setDraft((current) => buildActivityDraftFromAi(current, category, payload));
      setIsMagicModalOpen(false);
    } catch (error) {
      console.error("Error al cargar mock JSON:", error);
    }
  }

  function handleMagicStartManual(
    category,
    { tourName, cityName, regionName, selectedSubcategory } = {},
  ) {
    setDraft((current) => ({
      ...current,
      categoryId: category || current.categoryId,
      subcategoryId: selectedSubcategory || current.subcategoryId,
      title: tourName ?? current.title,
      city: cityName ?? current.city,
      region: regionName ?? current.region,
    }));
    setIsMagicModalOpen(false);
  }

  function handleMagicGenerateRestaurant(category, payload = {}) {
    try {
      if (!payload.aiData) {
        return;
      }

      applyWizardImages(payload.images);
      setDraft((current) => buildRestaurantDraftFromAi(current, category, payload));
      setIsRestaurantMagicModalOpen(false);
    } catch (error) {
      console.error("Error al cargar mock JSON de restaurante:", error);
    }
  }

  function handleMagicGenerateTransport(category, payload = {}) {
    try {
      if (!payload.aiData) {
        return;
      }

      applyWizardImages(payload.images);
      setDraft((current) => buildTransportDraftFromAi(current, category, payload));
      setIsTransportMagicModalOpen(false);
    } catch (error) {
      console.error("Error al cargar mock JSON de transporte:", error);
    }
  }

  function handleMagicGeneratePlan(category, payload = {}) {
    try {
      if (!payload.aiData) {
        return;
      }

      applyWizardImages(payload.images);
      setDraft((current) => buildPlanDraftFromAi(current, category, payload));
      setIsPlanMagicModalOpen(false);
    } catch (error) {
      console.error("Error al cargar mock JSON de planes:", error);
    }
  }

  function handleMagicGenerateExcursion(category, payload = {}) {
    try {
      if (!payload.aiData) {
        return;
      }

      applyWizardImages(payload.images);
      setDraft((current) => buildExcursionDraftFromAi(current, category, payload));
      setIsExcursionMagicModalOpen(false);
    } catch (error) {
      console.error("Error al cargar mock JSON de excursiones:", error);
    }
  }

  function handleCategoryChange(nextCategoryId) {
    setDraft((current) => ({
      ...current,
      categoryId: nextCategoryId,
      subcategoryId: "",
      departureTime: nextCategoryId === "actividades" ? current.departureTime : "",
      returnTime: nextCategoryId === "actividades" ? current.returnTime : "",
    }));
    setFormError("");

    if (nextCategoryId === "transporte") {
      setIsTransportMagicModalOpen(true);
      setIsMagicModalOpen(false);
    } else if (nextCategoryId === "restaurantes") {
      setIsRestaurantMagicModalOpen(true);
      setIsMagicModalOpen(false);
    } else if (nextCategoryId === "planes") {
      setIsPlanMagicModalOpen(true);
      setIsMagicModalOpen(false);
    } else if (nextCategoryId === "excursiones") {
      setIsExcursionMagicModalOpen(true);
      setIsMagicModalOpen(false);
    }
  }

  return (
    <div className="detalle-producto-page detalle-producto-page--admin">
      <PrimaryHeader />

      <ProductMagicAiModal
        isOpen={isMagicModalOpen}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerate}
        onStartManual={handleMagicStartManual}
        initialData={wizardInitialData}
        onSwitchToTransport={({ selectedCategory, selectedSubcategory, tourName, cityName, regionName }) => {
          setWizardInitialData({
            selectedCategory,
            selectedSubcategory,
            tourName,
            cityName,
            regionName,
          });
          setIsMagicModalOpen(false);
          setIsTransportMagicModalOpen(true);
        }}
        onSwitchToRestaurant={({ selectedCategory, selectedSubcategory, tourName, cityName, regionName }) => {
          setWizardInitialData({
            selectedCategory,
            selectedSubcategory,
            tourName,
            cityName,
            regionName,
          });
          setIsMagicModalOpen(false);
          setIsRestaurantMagicModalOpen(true);
        }}
        onSwitchToPlan={({ selectedCategory, selectedSubcategory, tourName, cityName, regionName }) => {
          setWizardInitialData({
            selectedCategory,
            selectedSubcategory,
            tourName,
            cityName,
            regionName,
          });
          setIsMagicModalOpen(false);
          setIsPlanMagicModalOpen(true);
        }}
        onSwitchToExcursion={({ selectedCategory, selectedSubcategory, tourName, cityName, regionName, numeroDias }) => {
          setWizardInitialData({
            selectedCategory,
            selectedSubcategory,
            tourName,
            cityName,
            regionName,
            numeroDias,
          });
          setIsMagicModalOpen(false);
          setIsExcursionMagicModalOpen(true);
        }}
      />

      <ProductTransportMagicAiModal
        isOpen={isTransportMagicModalOpen}
        initialData={wizardInitialData}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerateTransport}
        onBackToSetup={(nextInitialData) => {
          setWizardInitialData(nextInitialData);
          setIsTransportMagicModalOpen(false);
          setIsMagicModalOpen(true);
        }}
      />

      <ProductRestaurantMagicAiModal
        isOpen={isRestaurantMagicModalOpen}
        initialData={wizardInitialData}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerateRestaurant}
        onStartManual={handleMagicStartManual}
        onBackToSetup={(nextInitialData) => {
          setWizardInitialData(nextInitialData);
          setIsRestaurantMagicModalOpen(false);
          setIsMagicModalOpen(true);
        }}
      />

      <ProductPlanMagicAiModal
        isOpen={isPlanMagicModalOpen}
        initialData={wizardInitialData}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGeneratePlan}
        onStartManual={handleMagicStartManual}
        onBackToSetup={(nextInitialData) => {
          setWizardInitialData(nextInitialData);
          setIsPlanMagicModalOpen(false);
          setIsMagicModalOpen(true);
        }}
      />

      <ProductExcursionMagicAiModal
        isOpen={isExcursionMagicModalOpen}
        initialData={wizardInitialData}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerateExcursion}
        onBackToSetup={(nextInitialData) => {
          setWizardInitialData(nextInitialData);
          setIsExcursionMagicModalOpen(false);
          setIsMagicModalOpen(true);
        }}
      />

      <main className="detalle-producto-main">
        <div className="detalle-producto-admin-sticky-shell">
          <div className="detalle-producto-admin-sticky-wrap">
            <section className="detalle-producto-admin-actions">
              <div className="detalle-producto-admin-actions-copy">
                <p>Creando producto</p>
              </div>

              <div className="detalle-producto-admin-actions-grid">
                <button
                  type="button"
                  className="detalle-producto-admin-action"
                  onClick={handleSaveProduct}
                  disabled={isSavingProduct}
                >
                  <span className="lds-button-content">
                    {isSavingProduct ? (
                      <LoadingSpinner label="Guardando producto" size="sm" />
                    ) : (
                      <span className="material-icons-outlined" aria-hidden="true">
                        save
                      </span>
                    )}
                    <span>{isSavingProduct ? "Guardando..." : "Guardar producto"}</span>
                  </span>
                </button>

                <button
                  type="button"
                  className="detalle-producto-admin-action detalle-producto-admin-action--danger"
                  onClick={handleCancel}
                  disabled={isSavingProduct}
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    close
                  </span>
                  <span>Cancelar</span>
                </button>
              </div>
            </section>
          </div>
        </div>

        <div className="detalle-producto-shell">
          <div className="detalle-producto-gallery-wrap detalle-producto-gallery-wrap--editing">
            <ProductGalleryEditor
              productName={draft.title || "Nuevo producto"}
              slots={gallerySlots}
              selectedSlot={selectedGallerySlot}
              message={galleryMessage}
              messageType={galleryMessageType}
              onSelectSlot={setSelectedGallerySlot}
              onChooseFile={handleChooseGalleryFile}
              onRemoveSlot={handleRemoveGallerySlot}
              modeLabel="Creacion de producto"
              description="Todos los slots inician vacios. Selecciona la imagen principal y luego completa las imagenes secundarias."
            />
          </div>

          <div className="detalle-producto-content-wrap">
            <ProductCreateFormErrorToast
              message={formError}
              onClose={() => setFormError("")}
            />

            <div className="detalle-producto-layout">
              <ProductCreateEditorContent
                availableSubcategories={availableSubcategories}
                draft={draft}
                onAddObjectListItem={addObjectListItem}
                onAddStringListItem={addStringListItem}
                onCategoryChange={handleCategoryChange}
                onGeneralFieldChange={handleGeneralFieldChange}
                onRemoveObjectListItem={removeObjectListItem}
                onRemoveStringListItem={removeStringListItem}
                onUpdateObjectListField={updateObjectListField}
                onUpdateStringListField={updateStringListField}
                productCategories={productCategories}
                requiresActivityTimes={requiresActivityTimes}
              />

              <div className="detalle-producto-sidebar">
                <ProductCreateSidebar
                  activeBlock={activeBlock}
                  booking={bookingForSidebar}
                  categoryId={draft.categoryId}
                  draft={draft}
                  onActivateBlock={setActiveBlock}
                  onAddPeriod={addHighSeasonPeriod}
                  onBasePriceChange={updateBookingBasePrice}
                  onGridPriceChange={updateBookingGridPrice}
                  onRemovePeriod={removeHighSeasonPeriod}
                  onUpdatePeriod={updateHighSeasonPeriod}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer data={footerData} />

      {createdProductInfo ? (
        <div
          className="panel-control-product-coupon-success-backdrop"
          onClick={closeCreationSuccess}
        >
          <div
            className="panel-control-product-coupon-success-alert"
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-product-create-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-control-product-coupon-success-icon">
              <span className="material-icons-outlined" aria-hidden="true">
                inventory_2
              </span>
            </div>

            <div className="panel-control-product-coupon-success-copy">
              <p>Producto creado</p>
              <h3 id="panel-control-product-create-success-title">
                {createdProductInfo.title}
              </h3>
              <span>
                El producto fue creado correctamente en la categoria{" "}
                {createdProductInfo.categoryLabel} y quedo en estado inactivo
                para que puedas revisarlo antes de publicarlo.
              </span>
            </div>

            <button
              type="button"
              className="panel-control-product-coupon-success-button"
              onClick={closeCreationSuccess}
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
