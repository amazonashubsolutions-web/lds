import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  ProductCouponModal,
  ProductCouponSuccessAlert,
} from "../panel-control/DashboardProductsSection";
import ProductCouponsModal from "./ProductCouponsModal";
import {
  createProductCouponDraft,
  createProductCouponRecord,
  persistProductCouponRecord,
} from "../../utils/productCouponsStorage";

const ProductCouponManager = forwardRef(
  (
    {
      panelProduct,
      productName,
      productImage,
      productCouponItems,
      onCouponCreated,
    },
    ref,
  ) => {
    const [couponForm, setCouponForm] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [couponSuccess, setCouponSuccess] = useState(null);
    const [isDiscountValueFocused, setIsDiscountValueFocused] = useState(false);
    const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);

    useEffect(() => {
      if (!couponForm && !couponSuccess && !isCouponsModalOpen) {
        return undefined;
      }

      const previousOverflow = document.body.style.overflow;

      function handleEscape(event) {
        if (event.key === "Escape") {
          setCouponForm(null);
          setCouponError("");
          setCouponSuccess(null);
          setIsDiscountValueFocused(false);
          setIsCouponsModalOpen(false);
        }
      }

      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", handleEscape);
      };
    }, [couponForm, couponSuccess, isCouponsModalOpen]);

    useImperativeHandle(ref, () => ({
      openCreateModal: () => {
        if (!panelProduct) return;
        setCouponForm(createProductCouponDraft(panelProduct));
        setCouponError("");
        setIsDiscountValueFocused(false);
      },
      openListModal: () => {
        setIsCouponsModalOpen(true);
      },
      closeAll: () => {
        setCouponForm(null);
        setCouponError("");
        setCouponSuccess(null);
        setIsDiscountValueFocused(false);
        setIsCouponsModalOpen(false);
      },
    }));

    function closeCouponModal() {
      setCouponForm(null);
      setCouponError("");
      setIsDiscountValueFocused(false);
    }

    function closeCouponSuccessAlert() {
      setCouponSuccess(null);
    }

    function closeCouponsModal() {
      setIsCouponsModalOpen(false);
    }

    function handleCouponFieldChange(field, nextValue, conditionId) {
      setCouponForm((current) => {
        if (!current) {
          return current;
        }

        if (!conditionId) {
          return {
            ...current,
            [field]: nextValue,
          };
        }

        return {
          ...current,
          ruleConditions: current.ruleConditions.map((condition) => {
            if (condition.id !== conditionId) {
              return condition;
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
      setCouponSuccess({
        couponId: nextCoupon.id,
        couponName: nextCoupon.code,
        productName: couponForm.subjectName,
      });
      closeCouponModal();
      
      if (onCouponCreated) {
        onCouponCreated();
      }
    }

    return (
      <>
        {couponForm && (
          <ProductCouponModal
            formData={couponForm}
            errorMessage={couponError}
            isDiscountValueFocused={isDiscountValueFocused}
            title={`Crear cupon para ${couponForm.subjectName}`}
            onFieldChange={handleCouponFieldChange}
            onDiscountValueFocus={handleDiscountValueFocus}
            onDiscountValueBlur={handleDiscountValueBlur}
            onStartsAtBlur={handleStartsAtBlur}
            onRuleConditionChange={handleCouponFieldChange}
            onAddRuleCondition={handleAddRuleCondition}
            onRemoveRuleCondition={handleRemoveRuleCondition}
            onRuleConditionBlur={handleRuleConditionBlur}
            onClose={closeCouponModal}
            onSubmit={handleCouponSubmit}
          />
        )}

        <ProductCouponSuccessAlert
          message={couponSuccess}
          onClose={closeCouponSuccessAlert}
        />

        <ProductCouponsModal
          isOpen={isCouponsModalOpen}
          productName={productName}
          productImage={productImage}
          items={productCouponItems}
          onClose={closeCouponsModal}
        />
      </>
    );
  },
);

export default ProductCouponManager;
