import { useSearchParams } from "react-router-dom";

import CouponStatusFeedbackModal from "../components/panel-control/CouponStatusFeedbackModal";
import DashboardCouponsSection from "../components/panel-control/DashboardCouponsSection";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import ProductCouponModal from "../components/panel-control/ProductCouponModal";
import PrimaryHeader from "../components/layout/PrimaryHeader";
import Footer from "../components/resultados/Footer";
import usePanelCoupons from "../hooks/usePanelCoupons";
import {
  footerData,
  panelControlClientCoupons,
  panelControlMenu,
  panelControlProfile,
} from "../data/panelControlData";

const productCouponColumns = [
  { key: "id", label: "ID" },
  { key: "productName", label: "Nombre producto" },
  { key: "couponName", label: "Nombre cupon" },
  { key: "description", label: "Descripcion" },
  { key: "discountValue", label: "Valor de descuento" },
  { key: "createdAt", label: "Fecha de creacion" },
  { key: "startsAt", label: "Fecha de inicio" },
  { key: "endsAt", label: "Fecha de finalizacion" },
  { key: "rule", label: "Regla del cupon" },
  { key: "discountTarget", label: "Target del descuento" },
  { key: "status", label: "Estado" },
];

const clientCouponColumns = [
  { key: "id", label: "ID" },
  { key: "customerName", label: "Cliente o pasajero" },
  { key: "bookingCode", label: "Codigo de reserva" },
  { key: "couponName", label: "Nombre cupon" },
  { key: "description", label: "Descripcion" },
  { key: "creationReason", label: "Razon de creacion" },
  { key: "couponValue", label: "Valor cupon" },
  { key: "createdAt", label: "Fecha de creacion" },
  { key: "expiresAt", label: "Fecha de caducidad" },
  { key: "status", label: "Estado" },
];

export default function PanelControlCouponsPage() {
  const [searchParams] = useSearchParams();
  const {
    activeTab,
    closeCouponModal,
    closeCouponStatusNotice,
    couponError,
    couponForm,
    couponStatusNotice,
    couponTabs,
    filteredClientCoupons,
    filteredProductCoupons,
    filteredProductName,
    handleAddRuleCondition,
    handleCouponFieldChange,
    handleCouponSubmit,
    handleDiscountValueBlur,
    handleDiscountValueFocus,
    handleRemoveRuleCondition,
    handleRuleConditionBlur,
    handleRuleConditionChange,
    handleStartsAtBlur,
    handleToggleProductCouponStatus,
    isDiscountValueFocused,
    isLoadingCoupons,
    isSubmittingCoupon,
    openEditCouponModal,
    searchTerm,
    setActiveTab,
    setSearchTerm,
    setStatusFilter,
    showProductFilterNotice,
    statusActionCouponId,
    statusFilter,
  } = usePanelCoupons({
    clientCoupons: panelControlClientCoupons,
    searchParams,
  });

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar
            menu={panelControlMenu}
            profile={panelControlProfile}
          />

          <section className="panel-control-content panel-control-coupons-page">
            <header className="panel-control-coupons-page-head">
              <p>Panel de cupones</p>
              <h1>Gestiona tus cupones comerciales</h1>
              <span>
                Administra descuentos para productos y beneficios asignados a
                clientes desde un mismo lugar.
              </span>
              {showProductFilterNotice ? (
                <small className="panel-control-coupons-page-filter">
                  {`Vista filtrada para ${filteredProductName}.`}
                </small>
              ) : null}
            </header>

            <div
              className="panel-control-coupons-tabs"
              role="tablist"
              aria-label="Tipos de cupones"
            >
              {couponTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={
                    activeTab === tab.id
                      ? "panel-control-coupons-tab panel-control-coupons-tab--active"
                      : "panel-control-coupons-tab"
                  }
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  <strong>{tab.count}</strong>
                </button>
              ))}
            </div>

            <div className="panel-control-coupons-filters panel-control-card">
              <label className="panel-control-coupons-filter-field panel-control-coupons-filter-field--search">
                <span>Buscar cupon</span>
                <div className="panel-control-coupons-search-input">
                  <span className="material-icons-outlined" aria-hidden="true">
                    search
                  </span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={
                      activeTab === "products"
                        ? "Busca por ID, producto, nombre, descripcion o regla"
                        : "Busca por ID, cliente, reserva, nombre o descripcion"
                    }
                  />
                </div>
              </label>

              <label className="panel-control-coupons-filter-field">
                <span>Estado</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </label>
            </div>

            {activeTab === "products" ? (
              <DashboardCouponsSection
                columns={productCouponColumns}
                description="Crea, revisa y monitorea cupones asociados a experiencias turisticas. "
                emptyMessage={
                  couponTabs[0]?.count === 0
                    ? "Todavia no hay cupones de producto cargados en Supabase."
                    : "No encontramos cupones de producto con esos criterios."
                }
                errorMessage={activeTab === "products" ? couponError : ""}
                isLoading={isLoadingCoupons}
                items={filteredProductCoupons}
                onEditItem={openEditCouponModal}
                onToggleStatusItem={handleToggleProductCouponStatus}
                statusActionItemId={statusActionCouponId}
                summaryPrimaryKey="productName"
                summarySecondaryKey="couponName"
                title="Cupones para Productos"
              />
            ) : null}

            {activeTab === "clients" ? (
              <DashboardCouponsSection
                columns={clientCouponColumns}
                description="Cupones reutilizables generados por cancelaciones del cliente o por cancelaciones directas del operador."
                emptyMessage="No encontramos cupones de clientes con esos criterios."
                items={filteredClientCoupons}
                summaryPrimaryKey="customerName"
                summarySecondaryKey="couponName"
                title="Cupones de Clientes"
              />
            ) : null}
          </section>
        </div>
      </main>

      <Footer data={footerData} />

      <ProductCouponModal
        formData={couponForm}
        errorMessage={couponError}
        isDiscountValueFocused={isDiscountValueFocused}
        title={couponForm ? `Editar cupon para ${couponForm.subjectName}` : undefined}
        submitLabel="Guardar cambios"
        onFieldChange={handleCouponFieldChange}
        onDiscountValueFocus={handleDiscountValueFocus}
        onDiscountValueBlur={handleDiscountValueBlur}
        onStartsAtBlur={handleStartsAtBlur}
        onRuleConditionChange={handleRuleConditionChange}
        onAddRuleCondition={handleAddRuleCondition}
        onRemoveRuleCondition={handleRemoveRuleCondition}
        onRuleConditionBlur={handleRuleConditionBlur}
        onClose={closeCouponModal}
        onSubmit={handleCouponSubmit}
        isSubmitting={isSubmittingCoupon}
      />

      <CouponStatusFeedbackModal
        notice={couponStatusNotice}
        onClose={closeCouponStatusNotice}
      />
    </div>
  );
}
