import { useState } from "react";
import { Link } from "react-router-dom";

import {
  COUPON_DISCOUNT_TARGET_LABELS,
  formatPassengerConditionsSentence,
  getCouponStatusLabel,
} from "../../data/couponsData";

const PASSENGER_TYPE_OPTIONS = [
  { value: "adult", label: "Adultos", countLabel: "Numero de adultos" },
  { value: "child", label: "Ninos", countLabel: "Numero de ninos" },
];

const PASSENGER_OPERATOR_OPTIONS = [
  { value: ">", label: "Mayor que (>)" },
  { value: "<", label: "Menor que (<)" },
  { value: "=", label: "Igual (=)" },
];

const COUPON_DISCOUNT_TARGET_OPTIONS = Object.entries(
  COUPON_DISCOUNT_TARGET_LABELS,
).map(([value, label]) => ({
  value,
  label,
}));

function formatProductPrice(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function getPassengerTypeOption(value) {
  return PASSENGER_TYPE_OPTIONS.find((option) => option.value === value);
}

function getAvailablePassengerTypeOptions(ruleConditions, conditionId) {
  const selectedTypes = new Set(
    ruleConditions
      .filter((condition) => condition.id !== conditionId)
      .map((condition) => condition.passengerType),
  );

  return PASSENGER_TYPE_OPTIONS.filter(
    (option) =>
      option.value ===
        ruleConditions.find((condition) => condition.id === conditionId)?.passengerType ||
      !selectedTypes.has(option.value),
  );
}

function buildCouponRulePreview(formData) {
  if (!formData) {
    return "";
  }

  if (!Array.isArray(formData.ruleConditions) || formData.ruleConditions.length === 0) {
    return "Configura al menos una condicion para la regla del cupon.";
  }

  const normalizedConditions = formData.ruleConditions
    .filter((condition) => condition.value !== "")
    .map((condition) => ({
      passengerType: condition.passengerType,
      operator: condition.operator,
      value: Number(condition.value),
    }));

  if (normalizedConditions.length !== formData.ruleConditions.length) {
    return "Completa todas las condiciones de la regla del cupon.";
  }

  return formatPassengerConditionsSentence(normalizedConditions);
}

export function ProductCouponModal({
  formData,
  errorMessage,
  isDiscountValueFocused,
  title,
  submitLabel = "Guardar cupon",
  onFieldChange,
  onDiscountValueFocus,
  onDiscountValueBlur,
  onStartsAtBlur,
  onRuleConditionChange,
  onAddRuleCondition,
  onRemoveRuleCondition,
  onRuleConditionBlur,
  onClose,
  onSubmit,
}) {
  const rulePreviewText = formData ? buildCouponRulePreview(formData) : "";
  const [rulePreviewAnimationVersion, setRulePreviewAnimationVersion] = useState(0);

  if (!formData) {
    return null;
  }

  function handlePassengerCountBlur(conditionId, value) {
    onRuleConditionBlur(conditionId);

    if (!value) {
      return;
    }

    setRulePreviewAnimationVersion((current) => current + 1);
  }

  return (
    <div className="panel-control-product-coupon-modal-backdrop" onClick={onClose}>
      <div
        className="panel-control-product-coupon-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-control-product-coupon-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="panel-control-product-coupon-modal-close"
          onClick={onClose}
          aria-label="Cerrar formulario de cupon"
        >
          <span className="material-icons-outlined">close</span>
        </button>

        <div className="panel-control-product-coupon-modal-head">
          <p>Cupon de producto</p>
          <h3 id="panel-control-product-coupon-modal-title">
            {title ?? `Crear cupon para ${formData.subjectName}`}
          </h3>
          <span>
            Completa los datos comerciales del cupon. El codigo del producto,
            la fecha de creacion y el estado ya quedan definidos.
          </span>
        </div>

        <form className="panel-control-product-coupon-form" onSubmit={onSubmit}>
          <div className="panel-control-product-coupon-form-grid panel-control-product-coupon-form-grid--meta">
            <label className="panel-control-product-coupon-field">
              <span>ID del cupon</span>
              <input value={formData.id} readOnly />
            </label>

            <label className="panel-control-product-coupon-field">
              <span>Producto asociado</span>
              <input value={formData.subjectName} readOnly />
            </label>

            <label className="panel-control-product-coupon-field">
              <span>Fecha de creacion</span>
              <input value={formData.createdAt} readOnly />
            </label>

            <label className="panel-control-product-coupon-field">
              <span>Estado</span>
              <input value={getCouponStatusLabel(formData.status)} readOnly />
            </label>
          </div>

          <div className="panel-control-product-coupon-form-grid">
            <label className="panel-control-product-coupon-field">
              <span>Nombre del cupon</span>
              <input
                type="text"
                name="couponName"
                value={formData.couponName}
                onChange={onFieldChange}
                placeholder="Ej. MINCA15"
                autoComplete="off"
                required
              />
            </label>

            <label className="panel-control-product-coupon-field">
              <span>Porcentaje de descuento</span>
              <input
                type="text"
                name="discountValue"
                value={
                  !isDiscountValueFocused && formData.discountValue
                    ? `${formData.discountValue}%`
                    : formData.discountValue
                }
                onChange={onFieldChange}
                onFocus={onDiscountValueFocus}
                onBlur={onDiscountValueBlur}
                placeholder="Ej. 15%"
                autoComplete="off"
                inputMode="numeric"
                maxLength={3}
                required
              />
            </label>

            <label className="panel-control-product-coupon-field">
              <span>Fecha de inicio</span>
              <input
                type="date"
                name="startsAt"
                value={formData.startsAt}
                onChange={onFieldChange}
                onBlur={onStartsAtBlur}
                min={formData.createdAtValue}
                required
              />
            </label>

            <label className="panel-control-product-coupon-field">
              <span>Fecha de finalizacion</span>
              <input
                type="date"
                name="endsAt"
                value={formData.endsAt}
                onChange={onFieldChange}
                min={formData.startsAt || formData.createdAtValue}
                required
              />
            </label>

            <label className="panel-control-product-coupon-field panel-control-product-coupon-field--full">
              <span>Motivo u objetivo del cupon</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={onFieldChange}
                placeholder="Explica el motivo u objetivo comercial de la creacion del cupon."
                rows={3}
                required
              />
            </label>

            <div className="panel-control-product-coupon-rule-builder panel-control-product-coupon-field--full">
              <span className="panel-control-product-coupon-rule-title">
                Regla del cupon
              </span>

              {formData.ruleConditions.map((condition, index) => {
                const passengerCountLabel =
                  getPassengerTypeOption(condition.passengerType)?.countLabel ??
                  "Numero de pasajeros";
                const availableOptions = getAvailablePassengerTypeOptions(
                  formData.ruleConditions,
                  condition.id,
                );

                return (
                  <div className="panel-control-product-coupon-rule-row" key={condition.id}>
                    <div className="panel-control-product-coupon-rule-grid">
                      <label className="panel-control-product-coupon-field">
                        <span>Tipo de pasajero</span>
                        <select
                          value={condition.passengerType}
                          onChange={(event) =>
                            onRuleConditionChange(condition.id, "passengerType", event.target.value)
                          }
                          required
                        >
                          {availableOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="panel-control-product-coupon-field">
                        <span>Condicional</span>
                        <select
                          value={condition.operator}
                          onChange={(event) =>
                            onRuleConditionChange(condition.id, "operator", event.target.value)
                          }
                          required
                        >
                          {PASSENGER_OPERATOR_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="panel-control-product-coupon-field">
                        <span>{passengerCountLabel}</span>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(event) =>
                            onRuleConditionChange(condition.id, "value", event.target.value)
                          }
                          onBlur={() => handlePassengerCountBlur(condition.id, condition.value)}
                          placeholder="Ej. 2"
                          autoComplete="off"
                          inputMode="numeric"
                          maxLength={3}
                          required
                        />
                      </label>
                    </div>

                    {index > 0 ? (
                      <button
                        type="button"
                        className="panel-control-product-coupon-rule-remove"
                        onClick={() => onRemoveRuleCondition(condition.id)}
                      >
                        Eliminar condicion
                      </button>
                    ) : null}

                    {index < formData.ruleConditions.length - 1 ? (
                      <div className="panel-control-product-coupon-rule-joiner">y</div>
                    ) : null}
                  </div>
                );
              })}

              {formData.ruleConditions.length < PASSENGER_TYPE_OPTIONS.length ? (
                <button
                  type="button"
                  className="panel-control-product-coupon-rule-add"
                  onClick={onAddRuleCondition}
                >
                  Agregar condicion
                </button>
              ) : null}

              <p
                key={`${rulePreviewAnimationVersion}-${rulePreviewText}`}
                className={
                  rulePreviewAnimationVersion > 0
                    ? "panel-control-product-coupon-rule-summary panel-control-product-coupon-rule-summary--animated"
                    : "panel-control-product-coupon-rule-summary"
                }
              >
                {rulePreviewText}
              </p>

              <label className="panel-control-product-coupon-field panel-control-product-coupon-field--discount-target">
                <span>{`A que se le debe aplicar el descuento del ${formData.discountValue || "0"}%?`}</span>
                <select
                  name="discountTarget"
                  value={formData.discountTarget}
                  onChange={onFieldChange}
                >
                  {COUPON_DISCOUNT_TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {errorMessage ? (
            <p className="panel-control-product-coupon-form-error">{errorMessage}</p>
          ) : null}

          <div className="panel-control-product-coupon-form-actions">
            <button
              type="button"
              className="panel-control-product-coupon-form-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="panel-control-product-coupon-form-primary"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProductCouponSuccessAlert({ message, onClose }) {
  if (!message) {
    return null;
  }

  const { couponId, couponName, productName } = message;

  return (
    <div className="panel-control-product-coupon-success-backdrop" onClick={onClose}>
      <div
        className="panel-control-product-coupon-success-alert"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="panel-control-product-coupon-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-control-product-coupon-success-icon" aria-hidden="true">
          <span className="material-icons-outlined">check_circle</span>
        </div>

        <div className="panel-control-product-coupon-success-copy">
          <p>Cupon creado</p>
          <h3 id="panel-control-product-coupon-success-title">
            {`Cupon creado ${couponId}`}
          </h3>
          <span>{`El cupon ${couponName} se creo correctamente para ${productName}.`}</span>
        </div>

        <button
          type="button"
          className="panel-control-product-coupon-success-button"
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default function DashboardProductsSection({ items, totalItems = items.length }) {
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

      {items.length > 0 ? (
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
          <strong>No encontramos productos con esos filtros.</strong>
          <p>
            Prueba con otra categoria, cambia el estado o limpia la busqueda para
            volver a ver el inventario completo.
          </p>
        </div>
      )}
    </section>
  );
}
