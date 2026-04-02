import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import { ProductCouponModal } from "../components/panel-control/DashboardProductsSection";
import DashboardCouponsSection from "../components/panel-control/DashboardCouponsSection";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import Footer from "../components/resultados/Footer";
import { formatCouponDateLabel, toProductCouponItem } from "../data/couponsData";
import { getProductNameById } from "../data/productsData";
import {
  createProductCouponEditDraft,
  createProductCouponRecord,
  getAllProductCouponRecords,
  persistProductCouponRecord,
} from "../utils/productCouponsStorage";
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

function normalizeSearchValue(value) {
  return String(value ?? "").toLowerCase().trim();
}

function matchesSearch(item, fields, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return fields.some((field) =>
    normalizeSearchValue(item[field]).includes(searchTerm),
  );
}

function CouponStatusFeedbackModal({ notice, onClose }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className="panel-control-coupon-status-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="panel-control-coupon-status-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-control-coupon-status-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="panel-control-coupon-status-modal-close"
          onClick={onClose}
          aria-label="Cerrar notificacion de estado del cupon"
        >
          <span className="material-icons-outlined">close</span>
        </button>

        <div className="panel-control-coupon-status-modal-icon" aria-hidden="true">
          <span className="material-icons-outlined">
            {notice.action === "activated" ? "verified" : "do_not_disturb_on"}
          </span>
        </div>

        <div className="panel-control-coupon-status-modal-copy">
          <p>{notice.action === "activated" ? "Cupon activado" : "Cupon inhabilitado"}</p>
          <h3 id="panel-control-coupon-status-modal-title">{notice.couponName}</h3>
          <span>{notice.description || "Sin descripcion registrada para este cupon."}</span>
        </div>

        <div className="panel-control-coupon-status-modal-details">
          <div className="panel-control-coupon-status-modal-detail">
            <span>Producto</span>
            <strong>{notice.productName}</strong>
          </div>
          <div className="panel-control-coupon-status-modal-detail">
            <span>Estado actual</span>
            <strong>{notice.statusLabel}</strong>
          </div>
          <div className="panel-control-coupon-status-modal-detail">
            <span>Fecha del cambio</span>
            <strong>{notice.changedAtLabel}</strong>
          </div>
        </div>

        <button
          type="button"
          className="panel-control-coupon-status-modal-button"
          onClick={onClose}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function PanelControlCouponsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("products");
  const [couponForm, setCouponForm] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isDiscountValueFocused, setIsDiscountValueFocused] = useState(false);
  const [couponStatusNotice, setCouponStatusNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, setRefreshToken] = useState(0);
  const productCouponRecords = getAllProductCouponRecords();
  const selectedProductId = Number(searchParams.get("producto"));
  const hasProductFilter = Number.isFinite(selectedProductId) && selectedProductId > 0;
  const filteredProductCouponRecords = hasProductFilter
    ? productCouponRecords.filter((coupon) => coupon.productId === selectedProductId)
    : productCouponRecords;
  const productCoupons = filteredProductCouponRecords.map(toProductCouponItem);
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  const filteredProductCoupons = productCoupons.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || normalizeSearchValue(item.status) === statusFilter;

    return (
      matchesStatus &&
      matchesSearch(
        item,
        ["id", "productName", "couponName", "description", "rule", "discountTarget"],
        normalizedSearchTerm,
      )
    );
  });
  const filteredClientCoupons = panelControlClientCoupons.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || normalizeSearchValue(item.status) === statusFilter;

    return (
      matchesStatus &&
      matchesSearch(
        item,
        ["id", "customerName", "bookingCode", "couponName", "description", "creationReason"],
        normalizedSearchTerm,
      )
    );
  });
  const filteredProductName = hasProductFilter
    ? getProductNameById(selectedProductId)
    : null;
  const showProductFilterNotice =
    Boolean(filteredProductName) && !normalizedSearchTerm;

  const couponTabs = [
    {
      id: "products",
      label: "Cupones para Productos",
      count: productCoupons.length,
    },
    {
      id: "clients",
      label: "Cupones de Clientes",
      count: panelControlClientCoupons.length,
    },
  ];

  useEffect(() => {
    if (!couponForm && !couponStatusNotice) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setCouponForm(null);
        setCouponError("");
        setIsDiscountValueFocused(false);
        setCouponStatusNotice(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [couponForm, couponStatusNotice]);

  useEffect(() => {
    if (!hasProductFilter) {
      return;
    }

    setActiveTab("products");
  }, [hasProductFilter]);

  useEffect(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, [activeTab]);

  function openEditCouponModal(item) {
    const couponRecord = productCouponRecords.find((coupon) => coupon.id === item.id);

    if (!couponRecord) {
      return;
    }

    setCouponForm(createProductCouponEditDraft(couponRecord));
    setCouponError("");
    setIsDiscountValueFocused(false);
  }

  function closeCouponModal() {
    setCouponForm(null);
    setCouponError("");
    setIsDiscountValueFocused(false);
  }

  function closeCouponStatusNotice() {
    setCouponStatusNotice(null);
  }

  function handleCouponFieldChange(event) {
    const { name, value } = event.target;

    setCouponForm((current) => {
      if (!current) {
        return current;
      }

      let nextValue = value;

      if (name === "discountValue") {
        const digitsOnlyValue = value.replace(/\D/g, "").slice(0, 3);

        if (!digitsOnlyValue) {
          nextValue = "";
        } else {
          nextValue = String(Math.min(Number(digitsOnlyValue), 100));
        }
      }

      const nextForm = {
        ...current,
        [name]: name === "couponName" ? nextValue.toUpperCase() : nextValue,
      };

      if (name === "startsAt") {
        nextForm.endsAt = nextValue;
      }

      return nextForm;
    });
  }

  function handleRuleConditionChange(conditionId, field, value) {
    setCouponForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ruleConditions: current.ruleConditions.map((condition) => {
          if (condition.id !== conditionId) {
            return condition;
          }

          let nextValue = value;

          if (field === "value") {
            nextValue = value.replace(/\D/g, "").slice(0, 3);
          }

          return {
            ...condition,
            [field]: nextValue,
          };
        }),
      };
    });
  }

  function handleAddRuleCondition() {
    setCouponForm((current) => {
      if (!current) {
        return current;
      }

      const usedPassengerTypes = new Set(
        current.ruleConditions.map((condition) => condition.passengerType),
      );
      const nextPassengerType = ["adult", "child"].find(
        (passengerType) => !usedPassengerTypes.has(passengerType),
      );

      if (!nextPassengerType) {
        return current;
      }

      return {
        ...current,
        ruleConditions: [
          ...current.ruleConditions,
          {
            id: `${nextPassengerType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            passengerType: nextPassengerType,
            operator: ">",
            value: "0",
          },
        ],
      };
    });
  }

  function handleRemoveRuleCondition(conditionId) {
    setCouponForm((current) => {
      if (!current || current.ruleConditions.length === 1) {
        return current;
      }

      return {
        ...current,
        ruleConditions: current.ruleConditions.filter(
          (condition) => condition.id !== conditionId,
        ),
      };
    });
  }

  function handleRuleConditionBlur() {
    setCouponError("");
  }

  function handleDiscountValueFocus() {
    setIsDiscountValueFocused(true);
  }

  function handleDiscountValueBlur() {
    setIsDiscountValueFocused(false);
  }

  function handleStartsAtBlur() {
    setCouponForm((current) => {
      if (!current?.startsAt) {
        return current;
      }

      return {
        ...current,
        endsAt: current.startsAt,
      };
    });
  }

  function handleCouponSubmit(event) {
    event.preventDefault();

    if (!couponForm) {
      return;
    }

    const requiredValues = [
      couponForm.couponName,
      couponForm.description,
      couponForm.discountValue,
      couponForm.startsAt,
      couponForm.endsAt,
    ];

    if (requiredValues.some((value) => !value.trim())) {
      setCouponError("Completa todos los campos obligatorios del cupon.");
      return;
    }

    if (couponForm.endsAt < couponForm.startsAt) {
      setCouponError(
        "La fecha de finalizacion debe ser igual o posterior a la fecha de inicio.",
      );
      return;
    }

    if (
      !Array.isArray(couponForm.ruleConditions) ||
      couponForm.ruleConditions.length === 0 ||
      couponForm.ruleConditions.some((condition) => !condition.value)
    ) {
      setCouponError("Completa todas las condiciones de la regla del cupon.");
      return;
    }

    const selectedPassengerTypes = couponForm.ruleConditions.map(
      (condition) => condition.passengerType,
    );

    if (new Set(selectedPassengerTypes).size !== selectedPassengerTypes.length) {
      setCouponError(
        "No repitas el mismo tipo de pasajero en varias condiciones del mismo cupon.",
      );
      return;
    }

    const nextCoupon = createProductCouponRecord(couponForm);

    if (!nextCoupon) {
      setCouponError("Ingresa un porcentaje valido entre 0 y 100.");
      return;
    }

    persistProductCouponRecord(nextCoupon);
    setRefreshToken((current) => current + 1);
    closeCouponModal();
  }

  function handleToggleProductCouponStatus(item) {
    const couponRecord = productCouponRecords.find((coupon) => coupon.id === item.id);

    if (!couponRecord) {
      return;
    }

    const nextStatus = couponRecord.status === "active" ? "inactive" : "active";

    persistProductCouponRecord({
      ...couponRecord,
      status: nextStatus,
    });

    setCouponStatusNotice({
      action: nextStatus === "active" ? "activated" : "disabled",
      couponName: couponRecord.code,
      description: couponRecord.description,
      productName: toProductCouponItem(couponRecord).productName,
      statusLabel: nextStatus === "active" ? "Activo" : "Inactivo",
      changedAtLabel: formatCouponDateLabel(new Date()),
    });

    setRefreshToken((current) => current + 1);
  }

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
                emptyMessage="No encontramos cupones de producto con esos criterios."
                items={filteredProductCoupons}
                onEditItem={openEditCouponModal}
                onToggleStatusItem={handleToggleProductCouponStatus}
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
      />

      <CouponStatusFeedbackModal
        notice={couponStatusNotice}
        onClose={closeCouponStatusNotice}
      />
    </div>
  );
}
