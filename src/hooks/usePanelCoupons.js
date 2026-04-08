import { useEffect, useMemo, useState } from "react";

import { formatCouponDateLabel, toProductCouponItem } from "../data/couponsData";
import { getProductNameById } from "../data/productsData";
import {
  createProductCouponEditDraft,
  createProductCouponRecord,
  getAllProductCouponRecords,
  persistProductCouponRecord,
} from "../utils/productCouponsStorage";

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

export default function usePanelCoupons({
  clientCoupons,
  searchParams,
}) {
  const [activeTabState, setActiveTabState] = useState("products");
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
  const activeTab = hasProductFilter ? "products" : activeTabState;

  const filteredProductCouponRecords = useMemo(
    () =>
      hasProductFilter
        ? productCouponRecords.filter((coupon) => coupon.productId === selectedProductId)
        : productCouponRecords,
    [hasProductFilter, productCouponRecords, selectedProductId],
  );

  const productCoupons = useMemo(
    () => filteredProductCouponRecords.map(toProductCouponItem),
    [filteredProductCouponRecords],
  );

  const normalizedSearchTerm = normalizeSearchValue(searchTerm);

  const filteredProductCoupons = useMemo(
    () =>
      productCoupons.filter((item) => {
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
      }),
    [normalizedSearchTerm, productCoupons, statusFilter],
  );

  const filteredClientCoupons = useMemo(
    () =>
      clientCoupons.filter((item) => {
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
      }),
    [clientCoupons, normalizedSearchTerm, statusFilter],
  );

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
      count: clientCoupons.length,
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

  function setActiveTab(nextTab) {
    if (hasProductFilter) {
      return;
    }

    setActiveTabState(nextTab);
    setSearchTerm("");
    setStatusFilter("all");
  }

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

  return {
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
    openEditCouponModal,
    searchTerm,
    setActiveTab,
    setSearchTerm,
    setStatusFilter,
    showProductFilterNotice,
    statusFilter,
  };
}
