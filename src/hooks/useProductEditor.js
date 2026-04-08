import { useCallback, useState, useEffect } from "react";
import {
  createProductGallerySlots,
  persistProductGallery,
} from "../utils/productGalleryRepository";
import { persistProductDetailContent } from "../utils/productDetailContentRepository";

function cloneBookingPriceItems(items = []) {
  return items.map((item) => ({ ...item }));
}

function cloneBookingData(booking) {
  return {
    ...booking,
    passengerFields: Array.isArray(booking?.passengerFields)
      ? booking.passengerFields.map((field) => ({ ...field }))
      : [],
    pricingDetails: booking?.pricingDetails
      ? {
          ...booking.pricingDetails,
          seasons: booking.pricingDetails.seasons
            ? {
                low: booking.pricingDetails.seasons.low
                  ? {
                      ...booking.pricingDetails.seasons.low,
                      periods: Array.isArray(
                        booking.pricingDetails.seasons.low.periods,
                      )
                        ? booking.pricingDetails.seasons.low.periods.map((period) => ({
                            ...period,
                          }))
                        : [],
                      individual: cloneBookingPriceItems(
                        booking.pricingDetails.seasons.low.individual,
                      ),
                      group: cloneBookingPriceItems(
                        booking.pricingDetails.seasons.low.group,
                      ),
                    }
                  : null,
                high: booking.pricingDetails.seasons.high
                  ? {
                      ...booking.pricingDetails.seasons.high,
                      periods: Array.isArray(
                        booking.pricingDetails.seasons.high.periods,
                      )
                        ? booking.pricingDetails.seasons.high.periods.map((period) => ({
                            ...period,
                          }))
                        : [],
                      individual: cloneBookingPriceItems(
                        booking.pricingDetails.seasons.high.individual,
                      ),
                      group: cloneBookingPriceItems(
                        booking.pricingDetails.seasons.high.group,
                      ),
                    }
                  : null,
              }
            : null,
          individual: cloneBookingPriceItems(booking.pricingDetails.individual),
          group: cloneBookingPriceItems(booking.pricingDetails.group),
        }
      : null,
    additionalCharges: Array.isArray(booking?.additionalCharges)
      ? booking.additionalCharges.map((charge) => ({ ...charge }))
      : [],
  };
}

export function createEditableContentDraft(detail) {
  return {
    title: detail.title,
    summary: detail.summary,
    overview: detail.overview.map((paragraph) => paragraph),
    itinerary: detail.itinerary.map((item) => ({ ...item })),
    includes: detail.includes.map((item) => ({ ...item })),
    excludes: detail.excludes.map((item) => ({ ...item })),
    recommendations: detail.recommendations.map((item) => item),
    considerations: detail.considerations.map((item) => item),
    cancellationPolicies: detail.cancellationPolicies.map((item) => item),
    booking: cloneBookingData(detail.booking),
  };
}

function createEditableItemId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sanitizePriceValue(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function useProductEditor(detail) {
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [gallerySlots, setGallerySlots] = useState(() => []);
  const [selectedGallerySlot, setSelectedGallerySlot] = useState(0);
  const [contentDraft, setContentDraft] = useState(() =>
    createEditableContentDraft(detail),
  );
  const [activeContentBlock, setActiveContentBlock] = useState(null);
  const [galleryEditorMessage, setGalleryEditorMessage] = useState("");
  const [galleryEditorMessageType, setGalleryEditorMessageType] = useState("");

  useEffect(() => {
    if (isEditingProduct) {
      return;
    }
    setContentDraft(createEditableContentDraft(detail));
  }, [detail, isEditingProduct]);

  useEffect(() => {
    if (!isEditingProduct) {
      return;
    }
    setGallerySlots(createProductGallerySlots(detail.galleryEntries));
    setContentDraft(createEditableContentDraft(detail));
    setSelectedGallerySlot(0);
    setActiveContentBlock(null);
  }, [detail.id, isEditingProduct]);

  const releaseGalleryPreviewUrls = useCallback((slots) => {
    slots.forEach((slot) => {
      const previewUrl = slot.image?.previewUrl;
      if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    });
  }, []);

  useEffect(
    () => () => {
      releaseGalleryPreviewUrls(gallerySlots);
    },
    [gallerySlots, releaseGalleryPreviewUrls],
  );

  const openEditProductMode = useCallback(() => {
    setIsEditingProduct(true);
    setGalleryEditorMessage("");
    setGalleryEditorMessageType("");
  }, []);

  const closeEditProductMode = useCallback(() => {
    releaseGalleryPreviewUrls(gallerySlots);
    setIsEditingProduct(false);
    setSelectedGallerySlot(0);
    setActiveContentBlock(null);
    setGalleryEditorMessage("");
    setGalleryEditorMessageType("");
  }, [gallerySlots, releaseGalleryPreviewUrls]);

  const updateContentListField = useCallback((fieldName, index, nextValue) => {
    setContentDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].map((item, itemIndex) =>
        itemIndex === index ? nextValue : item,
      ),
    }));
  }, []);

  const updateContentObjectListField = useCallback((fieldName, index, key, nextValue) => {
    setContentDraft((current) => ({
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
  }, []);

  const addContentListField = useCallback((fieldName, nextValue = "") => {
    setContentDraft((current) => ({
      ...current,
      [fieldName]: [...current[fieldName], nextValue],
    }));
  }, []);

  const removeContentListField = useCallback((fieldName, index) => {
    setContentDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].filter((_, itemIndex) => itemIndex !== index),
    }));
  }, []);

  const addContentObjectItem = useCallback((fieldName, prefix, nextValue) => {
    setContentDraft((current) => ({
      ...current,
      [fieldName]: [
        ...current[fieldName],
        {
          id: createEditableItemId(prefix),
          ...nextValue,
        },
      ],
    }));
  }, []);

  const removeContentObjectItem = useCallback((fieldName, index) => {
    setContentDraft((current) => ({
      ...current,
      [fieldName]: current[fieldName].filter((_, itemIndex) => itemIndex !== index),
    }));
  }, []);

  const updateBookingBasePrice = useCallback((nextValue) => {
    setContentDraft((current) => ({
      ...current,
      booking: {
        ...current.booking,
        price: sanitizePriceValue(nextValue),
      },
    }));
  }, []);

  const updateBookingGridPrice = useCallback((sectionKey, itemType, itemIndex, nextValue) => {
    setContentDraft((current) => {
      const currentPricingDetails = current.booking?.pricingDetails ?? {};
      const nextPrice = sanitizePriceValue(nextValue);

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
                  ...currentPricingDetails.seasons?.[sectionKey],
                  [itemType]: (
                    currentPricingDetails.seasons?.[sectionKey]?.[itemType] ?? []
                  ).map((item, currentIndex) =>
                    currentIndex === itemIndex
                      ? {
                          ...item,
                          price: nextPrice,
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
            [itemType]: (currentPricingDetails[itemType] ?? []).map(
              (item, currentIndex) =>
                currentIndex === itemIndex
                  ? {
                      ...item,
                      price: nextPrice,
                    }
                  : item,
            ),
          },
        },
      };
    });
  }, []);

  const updateHighSeasonPeriod = useCallback((periodIndex, key, nextValue) => {
    setContentDraft((current) => {
      const currentPricingDetails = current.booking?.pricingDetails ?? {};
      const currentHighSeason = currentPricingDetails.seasons?.high ?? {};

      return {
        ...current,
        booking: {
          ...current.booking,
          pricingDetails: {
            ...currentPricingDetails,
            seasons: {
              ...currentPricingDetails.seasons,
              high: {
                ...currentHighSeason,
                periods: (currentHighSeason.periods ?? []).map(
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
      };
    });
  }, []);

  const addHighSeasonPeriod = useCallback(() => {
    setContentDraft((current) => {
      const currentPricingDetails = current.booking?.pricingDetails ?? {};
      const currentHighSeason = currentPricingDetails.seasons?.high ?? {};

      return {
        ...current,
        booking: {
          ...current.booking,
          pricingDetails: {
            ...currentPricingDetails,
            seasons: {
              ...currentPricingDetails.seasons,
              high: {
                ...currentHighSeason,
                periods: [
                  ...(currentHighSeason.periods ?? []),
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
      };
    });
  }, []);

  const removeHighSeasonPeriod = useCallback((periodIndex) => {
    setContentDraft((current) => {
      const currentPricingDetails = current.booking?.pricingDetails ?? {};
      const currentHighSeason = currentPricingDetails.seasons?.high ?? {};

      return {
        ...current,
        booking: {
          ...current.booking,
          pricingDetails: {
            ...currentPricingDetails,
            seasons: {
              ...currentPricingDetails.seasons,
              high: {
                ...currentHighSeason,
                periods: (currentHighSeason.periods ?? []).filter(
                  (_, currentIndex) => currentIndex !== periodIndex,
                ),
              },
            },
          },
        },
      };
    });
  }, []);

  const handleRemoveGallerySlot = useCallback((slotIndex) => {
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
    setGalleryEditorMessage("Slot limpiado. Puedes elegir otra imagen.");
    setGalleryEditorMessageType("success");
  }, []);

  function createPublicGalleryUrl(fileName) {
    if (!fileName) return "";
    return `/images/productos/${fileName}`;
  }

  const handleChooseGalleryFile = useCallback(
    async (slotIndex, file) => {
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
                  id: `product-${detail.id}-gallery-${slot.slot + 1}`,
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
        setGalleryEditorMessage("Imagen lista para guardar.");
        setGalleryEditorMessageType("success");
      } catch {
        setGalleryEditorMessage(
          "No pudimos procesar esa imagen. Intenta con otro archivo.",
        );
        setGalleryEditorMessageType("error");
      }
    },
    [detail.id],
  );

  const handleSaveGallery = useCallback(
    () => {
      const nextImages = gallerySlots
        .map((slot) =>
          slot.image?.url?.trim()
            ? {
                ...slot.image,
                url: slot.image.url.trim(),
                previewUrl: undefined,
                position: slot.slot,
                isPrimary: slot.slot === 0,
              }
            : null,
        )
        .filter(Boolean);

      try {
        persistProductGallery(detail.id, nextImages);
        persistProductDetailContent(detail.id, contentDraft);
        releaseGalleryPreviewUrls(gallerySlots);
        setGalleryEditorMessage("Producto actualizado correctamente.");
        setGalleryEditorMessageType("success");
        closeEditProductMode();
      } catch {
        setGalleryEditorMessage(
          "No fue posible guardar los cambios del producto. Intenta de nuevo.",
        );
        setGalleryEditorMessageType("error");
      }
    },
    [
      detail.id,
      gallerySlots,
      contentDraft,
      releaseGalleryPreviewUrls,
      closeEditProductMode,
    ],
  );

  const mergeAiDraft = useCallback((aiData) => {
    setContentDraft((current) => ({
      ...current,
      title: aiData.titulo || current.title,
      summary: aiData.descripcion_breve || current.summary,
      overview: Array.isArray(aiData.descripcion_general) ? aiData.descripcion_general : current.overview,
      itinerary: Array.isArray(aiData.itinerario) ? aiData.itinerario.map(it => ({
        id: createEditableItemId("itinerary"),
        title: it.titulo || it.label || "",
        description: it.descripcion || ""
      })) : current.itinerary,
      includes: Array.isArray(aiData.que_incluye) ? aiData.que_incluye.map(item => ({
        id: createEditableItemId("include"),
        title: item.title || item.label || "",
        description: item.description || ""
      })) : current.includes,
      excludes: Array.isArray(aiData.que_no_incluye) ? aiData.que_no_incluye.map(item => ({
        id: createEditableItemId("exclude"),
        title: item.title || item.label || "",
        description: item.description || ""
      })) : current.excludes,
      recommendations: Array.isArray(aiData.recomendaciones) ? aiData.recomendaciones : current.recommendations,
      considerations: Array.isArray(aiData.consideraciones) ? aiData.consideraciones : current.consideraciones,
      cancellationPolicies: Array.isArray(aiData.politicas) ? aiData.politicas : current.cancellationPolicies,
    }));
  }, []);

  return {
    isEditingProduct,
    gallerySlots,
    selectedGallerySlot,
    contentDraft,
    activeContentBlock,
    galleryEditorMessage,
    galleryEditorMessageType,
    setIsEditingProduct,
    setGallerySlots,
    setSelectedGallerySlot,
    setContentDraft,
    setActiveContentBlock,
    setGalleryEditorMessage,
    setGalleryEditorMessageType,
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
    releaseGalleryPreviewUrls,
    mergeAiDraft,
  };
}
