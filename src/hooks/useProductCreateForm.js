import { useCallback, useEffect, useMemo, useState } from "react";

import {
  productCategories,
  productSubcategories,
} from "../data/productsData";
import {
  MAX_PRODUCT_GALLERY_IMAGES,
  createProductGallerySlots,
} from "../utils/productGalleryRepository";
import { createProductInSupabase } from "../services/products/adminMutations";
import {
  buildSlugFromName,
  createEditableItemId,
  createInitialDraft,
  createPublicGalleryUrl,
  formatTimeToMeridiem,
  normalizeText,
  sanitizePriceValue,
} from "../utils/productCreateDraft";

export default function useProductCreateForm({
  onCancelNavigate,
  onSuccessNavigate,
}) {
  const normalizeDraftState = useCallback((nextDraft) => {
    const nextAvailableSubcategories = productSubcategories.filter(
      (subcategory) => subcategory.categoryId === nextDraft.categoryId,
    );
    const normalizedSubcategoryId =
      nextDraft.subcategoryId &&
      nextAvailableSubcategories.some(
        (subcategory) => subcategory.id === nextDraft.subcategoryId,
      )
        ? nextDraft.subcategoryId
        : "";

    return {
      ...nextDraft,
      subcategoryId: normalizedSubcategoryId,
      booking: {
        ...(nextDraft.booking ?? {}),
        unitLabel: `por ${nextDraft.pricingUnitLabel}`,
      },
    };
  }, []);

  const [draft, setDraftState] = useState(() =>
    normalizeDraftState(createInitialDraft()),
  );
  const setDraft = useCallback(
    (nextDraft) => {
      setDraftState((current) =>
        normalizeDraftState(
          typeof nextDraft === "function" ? nextDraft(current) : nextDraft,
        ),
      );
    },
    [normalizeDraftState],
  );
  const [gallerySlots, setGallerySlots] = useState(() =>
    createProductGallerySlots([], MAX_PRODUCT_GALLERY_IMAGES),
  );
  const [selectedGallerySlot, setSelectedGallerySlot] = useState(0);
  const [galleryMessage, setGalleryMessage] = useState("");
  const [galleryMessageType, setGalleryMessageType] = useState("");
  const [formError, setFormError] = useState("");
  const [createdProductInfo, setCreatedProductInfo] = useState(null);
  const [activeBlock, setActiveBlock] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const availableSubcategories = useMemo(
    () =>
      productSubcategories.filter(
        (subcategory) => subcategory.categoryId === draft.categoryId,
      ),
    [draft.categoryId],
  );

  const requiresActivityTimes = draft.categoryId === "actividades";

  const currentCategoryLabel =
    productCategories.find((category) => category.id === draft.categoryId)?.label ??
    "Sin categoria";

  useEffect(() => {
    return () => {
      gallerySlots.forEach((slot) => {
        const previewUrl = slot.image?.previewUrl;

        if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [gallerySlots]);

  useEffect(() => {
    if (!formError) {
      return undefined;
    }

    const timer = setTimeout(() => setFormError(""), 6000);
    return () => clearTimeout(timer);
  }, [formError]);

  const bookingForSidebar = useMemo(
    () => ({
      ...draft.booking,
      unitLabel: `por ${draft.pricingUnitLabel}`,
    }),
    [draft.booking, draft.pricingUnitLabel],
  );

  function handleGeneralFieldChange(fieldName, nextValue) {
    setDraft((current) => ({
      ...current,
      [fieldName]: nextValue,
    }));
    setFormError("");
  }

  function updateStringListField(fieldName, index, nextValue) {
    setDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].map((item, itemIndex) =>
        itemIndex === index ? nextValue : item,
      ),
    }));
    setFormError("");
  }

  function addStringListItem(fieldName, nextValue = "") {
    setDraft((current) => ({
      ...current,
      [fieldName]: [...current[fieldName], nextValue],
    }));
  }

  function removeStringListItem(fieldName, index) {
    setDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateObjectListField(fieldName, index, key, nextValue) {
    setDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: nextValue,
            }
          : item,
      ),
    }));
    setFormError("");
  }

  function addObjectListItem(fieldName, prefix, nextValue) {
    setDraft((current) => ({
      ...current,
      [fieldName]: [
        ...current[fieldName],
        {
          id: createEditableItemId(prefix),
          ...nextValue,
        },
      ],
    }));
  }

  function removeObjectListItem(fieldName, index) {
    setDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateBookingBasePrice(nextValue) {
    setDraft((current) => ({
      ...current,
      booking: {
        ...current.booking,
        price: sanitizePriceValue(nextValue),
      },
    }));
    setFormError("");
  }

  function updateBookingGridPrice(sectionKey, itemType, itemIndex, nextValue) {
    const normalizedValue = sanitizePriceValue(nextValue);

    setDraft((current) => {
      const currentPricingDetails = current.booking.pricingDetails;

      if (sectionKey) {
        return {
          ...current,
          booking: {
            ...current.booking,
            pricingDetails: {
              ...currentPricingDetails,
              seasons: {
                ...currentPricingDetails.seasons,
                [sectionKey]: {
                  ...currentPricingDetails.seasons[sectionKey],
                  [itemType]: currentPricingDetails.seasons[sectionKey][itemType].map(
                    (item, currentIndex) =>
                      currentIndex === itemIndex
                        ? {
                            ...item,
                            price: normalizedValue,
                          }
                        : item,
                  ),
                },
              },
            },
          },
        };
      }

      return {
        ...current,
        booking: {
          ...current.booking,
          pricingDetails: {
            ...currentPricingDetails,
            [itemType]: currentPricingDetails[itemType].map((item, currentIndex) =>
              currentIndex === itemIndex
                ? {
                    ...item,
                    price: normalizedValue,
                  }
                : item,
            ),
          },
        },
      };
    });
    setFormError("");
  }

  function updateHighSeasonPeriod(periodIndex, key, nextValue) {
    setDraft((current) => ({
      ...current,
      booking: {
        ...current.booking,
        pricingDetails: {
          ...current.booking.pricingDetails,
          seasons: {
            ...current.booking.pricingDetails.seasons,
            high: {
              ...current.booking.pricingDetails.seasons.high,
              periods: current.booking.pricingDetails.seasons.high.periods.map(
                (period, currentIndex) =>
                  currentIndex === periodIndex
                    ? {
                        ...period,
                        [key]: nextValue,
                      }
                    : period,
              ),
            },
          },
        },
      },
    }));
  }

  function addHighSeasonPeriod() {
    setDraft((current) => ({
      ...current,
      booking: {
        ...current.booking,
        pricingDetails: {
          ...current.booking.pricingDetails,
          seasons: {
            ...current.booking.pricingDetails.seasons,
            high: {
              ...current.booking.pricingDetails.seasons.high,
              periods: [
                ...current.booking.pricingDetails.seasons.high.periods,
                {
                  id: createEditableItemId("high-season-period"),
                  label: "",
                  startMonthDay: "",
                  endMonthDay: "",
                },
              ],
            },
          },
        },
      },
    }));
  }

  function removeHighSeasonPeriod(periodIndex) {
    setDraft((current) => ({
      ...current,
      booking: {
        ...current.booking,
        pricingDetails: {
          ...current.booking.pricingDetails,
          seasons: {
            ...current.booking.pricingDetails.seasons,
            high: {
              ...current.booking.pricingDetails.seasons.high,
              periods: current.booking.pricingDetails.seasons.high.periods.filter(
                (_, currentIndex) => currentIndex !== periodIndex,
              ),
            },
          },
        },
      },
    }));
  }

  async function handleChooseGalleryFile(slotIndex, file) {
    try {
      setGallerySlots((current) =>
        current.map((slot) => {
          if (slot.slot !== slotIndex) {
            return slot;
          }

          const currentPreviewUrl = slot.image?.previewUrl;

          if (
            typeof currentPreviewUrl === "string" &&
            currentPreviewUrl.startsWith("blob:")
          ) {
            URL.revokeObjectURL(currentPreviewUrl);
          }

          return {
            ...slot,
            image: {
              ...(slot.image ?? {
                id: `product-draft-gallery-${slot.slot + 1}`,
              }),
              url: createPublicGalleryUrl(file.name),
              previewUrl: URL.createObjectURL(file),
              fileName: file.name,
              position: slot.slot,
              isPrimary: slot.slot === 0,
            },
          };
        }),
      );
      setSelectedGallerySlot(slotIndex);
      setGalleryMessage("Imagen lista para guardar.");
      setGalleryMessageType("success");
      setFormError("");
    } catch {
      setGalleryMessage(
        "No pudimos procesar esa imagen. Intenta con otro archivo.",
      );
      setGalleryMessageType("error");
    }
  }

  function handleRemoveGallerySlot(slotIndex) {
    setGallerySlots((current) =>
      current.map((slot) => {
        if (slot.slot !== slotIndex) {
          return slot;
        }

        const previewUrl = slot.image?.previewUrl;

        if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        return {
          ...slot,
          image: null,
        };
      }),
    );
    setGalleryMessage("Slot limpiado. Puedes elegir otra imagen.");
    setGalleryMessageType("success");
  }

  function getPrimaryImageUrl() {
    return (
      gallerySlots.find((slot) => slot.slot === 0)?.image?.url ??
      gallerySlots.find((slot) => slot.image)?.image?.url ??
      ""
    );
  }

  function buildMetaEntries() {
    const entries = [];

    if (draft.departurePoint) {
      entries.push({
        id: createEditableItemId("meta"),
        label: "Punto de encuentro",
        value: draft.departurePoint,
      });
    }

    if (requiresActivityTimes && draft.departureTime) {
      entries.push({
        id: createEditableItemId("meta"),
        label: "Hora de salida",
        value: formatTimeToMeridiem(draft.departureTime),
      });
    }

    if (requiresActivityTimes && draft.returnTime) {
      entries.push({
        id: createEditableItemId("meta"),
        label: "Hora de regreso",
        value: formatTimeToMeridiem(draft.returnTime),
      });
    }

    if (draft.categoryId === "transporte") {
      if (draft.metaVehicleOriginal) {
        entries.push({
          id: createEditableItemId("meta"),
          label: "Vehiculo",
          value: draft.metaVehicleOriginal,
        });
      }
      if (draft.metaCapacityOriginal) {
        entries.push({
          id: createEditableItemId("meta"),
          label: "Capacidad",
          value: `Hasta ${draft.metaCapacityOriginal} Pasajeros`,
        });
      }
      if (draft.departureTime && draft.returnTime) {
        entries.push({
          id: createEditableItemId("meta"),
          label: "Franja Horaria",
          value: `${formatTimeToMeridiem(draft.departureTime)} a ${formatTimeToMeridiem(draft.returnTime)}`,
        });
      }
    }

    if (draft.categoryId === "restaurantes") {
      const { foodStyle, serviceFormat, openingTime, closingTime } =
        draft.metaRestaurant || {};

      if (foodStyle) {
        entries.push({
          id: createEditableItemId("meta"),
          label: "Estilo",
          value: `Cocina ${foodStyle}`,
        });
      }
      if (serviceFormat) {
        entries.push({
          id: createEditableItemId("meta"),
          label: "Servicio",
          value: serviceFormat,
        });
      }
      if (openingTime || closingTime) {
        entries.push({
          id: createEditableItemId("meta"),
          label: "Horario",
          value: `${formatTimeToMeridiem(openingTime)} a ${formatTimeToMeridiem(closingTime)}`,
        });
      }
    }

    return entries;
  }

  function validateDraft() {
    const firstImageUrl = getPrimaryImageUrl();

    if (!normalizeText(draft.title)) {
      return "Ingresa el titulo del producto.";
    }

    if (!draft.categoryId) {
      return "Selecciona la categoria del producto.";
    }

    if (!draft.subcategoryId) {
      return "Selecciona la subcategoria del producto.";
    }

    if (!normalizeText(draft.city) || !normalizeText(draft.region)) {
      return "Completa ciudad y region del producto.";
    }

    if (!normalizeText(draft.summary)) {
      return "Ingresa la descripcion principal del producto.";
    }

    if (!normalizeText(draft.departurePoint)) {
      return "Ingresa el punto de salida del producto.";
    }

    if (requiresActivityTimes && (!draft.departureTime || !draft.returnTime)) {
      return "Selecciona la hora de salida y la hora de regreso.";
    }

    if (!sanitizePriceValue(draft.booking.price)) {
      return "Ingresa el precio base del producto.";
    }

    if (!firstImageUrl) {
      return "Agrega al menos la imagen principal del producto.";
    }

    return "";
  }

  function buildCreatedRecord(nextProductId) {
    const galleryImages = gallerySlots
      .map((slot) =>
        slot.image?.url
          ? {
              ...slot.image,
              previewUrl: undefined,
              position: slot.slot,
              isPrimary: slot.slot === 0,
            }
          : null,
      )
      .filter(Boolean);
    const slug = buildSlugFromName(draft.title) || `producto-${nextProductId}`;

    return {
      product: {
        id: nextProductId,
        name: normalizeText(draft.title),
        city: normalizeText(draft.city),
        region: normalizeText(draft.region),
        categoryId: draft.categoryId,
        basePriceAmount: Number(sanitizePriceValue(draft.booking.price)),
        currencyCode: "COP",
        isFeatured: false,
        status: "inactive",
        coverImageUrl: getPrimaryImageUrl(),
        pricingLabel: "Desde",
        pricingUnitLabel: draft.pricingUnitLabel,
      },
      subcategoryIds: [draft.subcategoryId],
      detail: {
        id: `PDT-CREATED-${nextProductId}`,
        productId: nextProductId,
        slug,
        eyebrow: "Producto creado desde panel",
        galleryImageUrls: galleryImages.map((image) => image.url),
        summary: normalizeText(draft.summary),
        meta: buildMetaEntries(),
        overview: draft.overview.map((item) => normalizeText(item)).filter(Boolean),
        includes: draft.includes
          .map((item) => ({
            ...item,
            title: normalizeText(item.title),
            description: normalizeText(item.description),
          }))
          .filter((item) => item.title || item.description),
        excludes: draft.excludes
          .map((item) => ({
            ...item,
            title: normalizeText(item.title),
            description: normalizeText(item.description),
          }))
          .filter((item) => item.title || item.description),
        recommendations: draft.recommendations
          .map((item) => normalizeText(item))
          .filter(Boolean),
        considerations: draft.considerations
          .map((item) => normalizeText(item))
          .filter(Boolean),
        cancellationPolicies: draft.cancellationPolicies
          .map((item) => normalizeText(item))
          .filter(Boolean),
        itinerary: draft.itinerary
          .map((item) => ({
            ...item,
            day: normalizeText(item.day),
            title: normalizeText(item.title),
            description: normalizeText(item.description),
          }))
          .filter((item) => item.day || item.title || item.description),
        booking: {
          ...bookingForSidebar,
          productId: nextProductId,
          price: sanitizePriceValue(bookingForSidebar.price),
          unitLabel: `por ${draft.pricingUnitLabel}`,
          pricingDetails: {
            ...bookingForSidebar.pricingDetails,
            seasons: bookingForSidebar.pricingDetails.seasons
              ? {
                  low: {
                    ...bookingForSidebar.pricingDetails.seasons.low,
                    individual:
                      bookingForSidebar.pricingDetails.seasons.low.individual.map(
                        (item) => ({
                          ...item,
                          price: sanitizePriceValue(item.price),
                        }),
                      ),
                    group:
                      bookingForSidebar.pricingDetails.seasons.low.group.map((item) => ({
                        ...item,
                        price: sanitizePriceValue(item.price),
                      })),
                  },
                  high: {
                    ...bookingForSidebar.pricingDetails.seasons.high,
                    individual:
                      bookingForSidebar.pricingDetails.seasons.high.individual.map(
                        (item) => ({
                          ...item,
                          price: sanitizePriceValue(item.price),
                        }),
                      ),
                    group:
                      bookingForSidebar.pricingDetails.seasons.high.group.map((item) => ({
                        ...item,
                        price: sanitizePriceValue(item.price),
                      })),
                  },
                }
              : null,
          },
        },
      },
    };
  }

  async function handleSaveProduct() {
    if (isSavingProduct) {
      return;
    }

    const validationError = validateDraft();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const draftProductId = `draft-${Date.now()}`;
    const createdRecord = buildCreatedRecord(draftProductId);

    try {
      setIsSavingProduct(true);
      const createdProduct = await createProductInSupabase({
        createdRecord,
        draft,
      });

      setCreatedProductInfo({
        productId: createdProduct.productId,
        title: createdRecord.product.name,
        categoryLabel: currentCategoryLabel,
      });
      setFormError("");
    } catch (error) {
      setFormError(
        error.message ||
          "No fue posible guardar el producto en Supabase. Intenta de nuevo.",
      );
    } finally {
      setIsSavingProduct(false);
    }
  }

  function handleCancel() {
    const shouldLeave = window.confirm(
      "Si cancelas ahora, perderas la informacion diligenciada del producto nuevo. Quieres salir de todos modos?",
    );

    if (shouldLeave) {
      onCancelNavigate?.();
    }
  }

  function closeCreationSuccess() {
    if (!createdProductInfo) {
      return;
    }

    onSuccessNavigate?.(createdProductInfo.productId);
  }

  return {
    activeBlock,
    addHighSeasonPeriod,
    addObjectListItem,
    addStringListItem,
    availableSubcategories,
    bookingForSidebar,
    closeCreationSuccess,
    createdProductInfo,
    currentCategoryLabel,
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
    setCreatedProductInfo,
    setDraft,
    setFormError,
    setGallerySlots,
    setSelectedGallerySlot,
    updateBookingBasePrice,
    updateBookingGridPrice,
    updateHighSeasonPeriod,
    updateObjectListField,
    updateStringListField,
  };
}
