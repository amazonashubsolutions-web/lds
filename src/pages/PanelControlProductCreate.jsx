import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import ProductGalleryEditor from "../components/detalle-producto/ProductGalleryEditor";
import ProductPriceCard from "../components/detalle-producto/ProductPriceCard";
import Footer from "../components/resultados/Footer";
import { footerData } from "../data/panelControlData";
import {
  getAllProductRecords,
  productCategories,
  productSubcategories,
} from "../data/productsData";
import {
  MAX_PRODUCT_GALLERY_IMAGES,
  createProductGallerySlots,
} from "../utils/productGalleryRepository";
import {
  getNextCreatedProductId,
  persistCreatedProductRecord,
} from "../utils/createdProductsRepository";
import { persistProductStatus } from "../utils/productStatusStorage";

const DURATION_OPTIONS = [
  { value: "", label: "Selecciona una duracion" },
  { value: "Media jornada", label: "Media jornada" },
  { value: "Dia completo", label: "Dia completo" },
  { value: "2 dias / 1 noche", label: "2 dias / 1 noche" },
  { value: "3 dias / 2 noches", label: "3 dias / 2 noches" },
  { value: "4 dias / 3 noches", label: "4 dias / 3 noches" },
];

const PRICING_UNIT_OPTIONS = [
  { value: "persona", label: "Persona" },
  { value: "pareja", label: "Pareja" },
  { value: "noche", label: "Noche" },
  { value: "dia", label: "Dia" },
  { value: "trayecto", label: "Trayecto" },
  { value: "servicio", label: "Servicio" },
  { value: "cupo", label: "Cupo" },
];

const DEFAULT_HIGH_SEASON_PERIODS = [
  {
    id: "fin-de-ano",
    label: "del 15 de diciembre al 20 de enero",
    startMonthDay: "12-15",
    endMonthDay: "01-20",
  },
  {
    id: "semana-santa",
    label: "del 24 de marzo al 31 de marzo",
    startMonthDay: "03-24",
    endMonthDay: "03-31",
  },
  {
    id: "mitad-de-ano",
    label: "del 15 de junio al 15 de julio",
    startMonthDay: "06-15",
    endMonthDay: "07-15",
  },
];

function createEditableItemId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildSlugFromName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizePriceValue(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function formatTimeToMeridiem(value) {
  const normalizedValue = String(value ?? "").trim();
  const timeMatch = normalizedValue.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (!timeMatch) {
    return normalizedValue;
  }

  const hours24 = Number(timeMatch[1]);
  const minutes = timeMatch[2];
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${meridiem}`;
}

function createBookingItems(labelPrefix) {
  return [
    { id: "adults", label: `${labelPrefix} adulto`, price: "" },
    {
      id: "children",
      label: `${labelPrefix} nino`,
      ageHint: "de 3 a 10 anos",
      price: "",
    },
    {
      id: "babies",
      label: `${labelPrefix} bebe`,
      ageHint: "de 0 a 2 anos",
      price: "",
    },
  ];
}

function createBookingDraft(pricingUnitLabel = "persona") {
  return {
    productId: 0,
    price: "",
    unitLabel: `por ${pricingUnitLabel}`,
    buttonLabel: "Reservar ahora",
    passengerFields: [
      { id: "adults", label: "Adultos", min: 1, defaultValue: 1 },
      {
        id: "children",
        label: "Ninos",
        ageHint: "de 3 a 10 anos",
        min: 0,
        defaultValue: 0,
      },
      {
        id: "babies",
        label: "Bebes",
        ageHint: "de 0 a 2 anos",
        min: 0,
        defaultValue: 0,
      },
    ],
    pricingDetails: {
      groupMinPassengers: 6,
      groupRule:
        "La tarifa de grupo aplica desde 6 pasajeros pagados en la misma reserva y con el mismo operador.",
      seasons: {
        low: {
          title: "Temporada baja",
          note:
            "Aplica para fechas fuera de los periodos marcados como temporada alta.",
          individual: createBookingItems("Valor"),
          group: createBookingItems("Valor grupo"),
        },
        high: {
          title: "Temporada alta",
          note:
            "Aplica para fechas de mayor demanda y puede variar segun la operacion del destino.",
          periods: DEFAULT_HIGH_SEASON_PERIODS,
          individual: createBookingItems("Valor"),
          group: createBookingItems("Valor grupo"),
        },
      },
    },
    note: "",
    additionalCharges: [],
  };
}

function createInitialDraft() {
  return {
    title: "",
    summary: "",
    categoryId: "",
    subcategoryId: "",
    city: "",
    region: "",
    duration: "",
    departurePoint: "",
    departureTime: "",
    returnTime: "",
    pricingUnitLabel: "persona",
    overview: [""],
    itinerary: [],
    includes: [],
    excludes: [],
    recommendations: [""],
    considerations: [""],
    cancellationPolicies: [""],
    booking: createBookingDraft("persona"),
  };
}

function createPublicGalleryUrl(fileName) {
  return `/images/productos/${encodeURIComponent(fileName)}`;
}

function AddItemAction({ label, onClick }) {
  return (
    <button
      type="button"
      className="detalle-producto-inline-action detalle-producto-inline-action--add"
      onClick={onClick}
    >
      <span className="material-icons-outlined" aria-hidden="true">
        add
      </span>
      <span>{label}</span>
    </button>
  );
}

function RemoveItemAction({ label = "Eliminar", onClick }) {
  return (
    <button
      type="button"
      className="detalle-producto-inline-action detalle-producto-inline-action--remove"
      onClick={onClick}
    >
      <span className="material-icons-outlined" aria-hidden="true">
        delete
      </span>
      <span>{label}</span>
    </button>
  );
}

function CreateSectionHead({ title, addLabel, onAddItem }) {
  return (
    <div className="detalle-producto-section-head detalle-producto-section-head--editable">
      <h2>{title}</h2>
      {onAddItem ? <AddItemAction label={addLabel} onClick={onAddItem} /> : null}
    </div>
  );
}

export default function PanelControlProductCreatePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => createInitialDraft());
  const [gallerySlots, setGallerySlots] = useState(() =>
    createProductGallerySlots([], MAX_PRODUCT_GALLERY_IMAGES),
  );
  const [selectedGallerySlot, setSelectedGallerySlot] = useState(0);
  const [galleryMessage, setGalleryMessage] = useState("");
  const [galleryMessageType, setGalleryMessageType] = useState("");
  const [formError, setFormError] = useState("");
  const [createdProductInfo, setCreatedProductInfo] = useState(null);

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
    if (
      draft.subcategoryId &&
      !availableSubcategories.some(
        (subcategory) => subcategory.id === draft.subcategoryId,
      )
    ) {
      setDraft((current) => ({
        ...current,
        subcategoryId: "",
      }));
    }
  }, [availableSubcategories, draft.subcategoryId]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      booking: {
        ...current.booking,
        unitLabel: `por ${current.pricingUnitLabel}`,
      },
    }));
  }, [draft.pricingUnitLabel]);

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

  function handleCategoryChange(nextCategoryId) {
    setDraft((current) => ({
      ...current,
      categoryId: nextCategoryId,
      subcategoryId: "",
      departureTime: nextCategoryId === "actividades" ? current.departureTime : "",
      returnTime: nextCategoryId === "actividades" ? current.returnTime : "",
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

    if (draft.duration) {
      entries.push({
        id: createEditableItemId("meta"),
        label: "Duracion",
        value: draft.duration,
      });
    }

    if (draft.departurePoint) {
      entries.push({
        id: createEditableItemId("meta"),
        label: "Punto de salida",
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

    if (!draft.duration) {
      return "Selecciona la duracion del producto.";
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

  function handleCancel() {
    const shouldLeave = window.confirm(
      "Si cancelas ahora, perderas la informacion diligenciada del producto nuevo. Quieres salir de todos modos?",
    );

    if (shouldLeave) {
      navigate("/panel-de-control/productos");
    }
  }

  function handleSaveProduct() {
    const validationError = validateDraft();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const nextProductId = getNextCreatedProductId(
      getAllProductRecords().map((product) => product.id),
    );
    const createdRecord = buildCreatedRecord(nextProductId);

    persistCreatedProductRecord(createdRecord);
    persistProductStatus(nextProductId, "inactive");
    setCreatedProductInfo({
      productId: nextProductId,
      title: createdRecord.product.name,
      categoryLabel: currentCategoryLabel,
    });
    setFormError("");
  }

  function closeCreationSuccess() {
    if (!createdProductInfo) {
      return;
    }

    navigate(`/panel-de-control/productos/${createdProductInfo.productId}`);
  }

  return (
    <div className="detalle-producto-page detalle-producto-page--admin">
      <PrimaryHeader />

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
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    save
                  </span>
                  <span>Guardar producto</span>
                </button>

                <button
                  type="button"
                  className="detalle-producto-admin-action detalle-producto-admin-action--danger"
                  onClick={handleCancel}
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
            {formError ? (
              <div className="detalle-producto-gallery-editor-feedback detalle-producto-gallery-editor-feedback--error">
                {formError}
              </div>
            ) : null}

            <div className="detalle-producto-layout">
              <div className="detalle-producto-content">
                <section className="detalle-producto-hero-info">
                  <div className="detalle-producto-hero-edit-head">
                    <h1>{draft.title || "Nuevo producto"}</h1>
                  </div>

                  <div className="detalle-producto-location">
                    {draft.city && draft.region
                      ? `${draft.city}, ${draft.region}`
                      : "Ubicacion por definir"}
                  </div>

                  <div className="detalle-producto-admin-edit-fields detalle-producto-create-meta-grid">
                    <label className="detalle-producto-admin-edit-field">
                      <span>Titulo</span>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) =>
                          handleGeneralFieldChange("title", event.target.value)
                        }
                        placeholder="Nombre del producto"
                      />
                    </label>

                    <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--full">
                      <span>Descripcion</span>
                      <textarea
                        rows={4}
                        value={draft.summary}
                        onChange={(event) =>
                          handleGeneralFieldChange("summary", event.target.value)
                        }
                        placeholder="Describe brevemente el producto."
                      />
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Categoria</span>
                      <select
                        value={draft.categoryId}
                        onChange={(event) => handleCategoryChange(event.target.value)}
                      >
                        <option value="">Selecciona una categoria</option>
                        {productCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Subcategoria</span>
                      <select
                        value={draft.subcategoryId}
                        onChange={(event) =>
                          handleGeneralFieldChange("subcategoryId", event.target.value)
                        }
                        disabled={!draft.categoryId}
                      >
                        <option value="">Selecciona una subcategoria</option>
                        {availableSubcategories.map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Ciudad</span>
                      <input
                        type="text"
                        value={draft.city}
                        onChange={(event) =>
                          handleGeneralFieldChange("city", event.target.value)
                        }
                        placeholder="Ciudad principal"
                      />
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Region</span>
                      <input
                        type="text"
                        value={draft.region}
                        onChange={(event) =>
                          handleGeneralFieldChange("region", event.target.value)
                        }
                        placeholder="Departamento o region"
                      />
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Duracion</span>
                      <select
                        value={draft.duration}
                        onChange={(event) =>
                          handleGeneralFieldChange("duration", event.target.value)
                        }
                      >
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option.value || "empty"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Punto de salida</span>
                      <input
                        type="text"
                        value={draft.departurePoint}
                        onChange={(event) =>
                          handleGeneralFieldChange("departurePoint", event.target.value)
                        }
                        placeholder="Ej. Parque principal, lobby, recepcion"
                      />
                    </label>

                    {requiresActivityTimes ? (
                      <>
                        <label className="detalle-producto-admin-edit-field">
                          <span>Hora de salida</span>
                          <input
                            type="time"
                            value={draft.departureTime}
                            onChange={(event) =>
                              handleGeneralFieldChange(
                                "departureTime",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className="detalle-producto-admin-edit-field">
                          <span>Hora de regreso</span>
                          <input
                            type="time"
                            value={draft.returnTime}
                            onChange={(event) =>
                              handleGeneralFieldChange(
                                "returnTime",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </>
                    ) : null}

                    <label className="detalle-producto-admin-edit-field">
                      <span>Unidad de precio</span>
                      <select
                        value={draft.pricingUnitLabel}
                        onChange={(event) =>
                          handleGeneralFieldChange(
                            "pricingUnitLabel",
                            event.target.value,
                          )
                        }
                      >
                        {PRICING_UNIT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="detalle-producto-section">
                  <CreateSectionHead
                    title="Descripcion general"
                    addLabel="Agregar parrafo"
                    onAddItem={() => addStringListItem("overview", "")}
                  />

                  <div className="detalle-producto-copy">
                    {draft.overview.length ? (
                      draft.overview.map((paragraph, index) => (
                        <div className="detalle-producto-admin-edit-group" key={`overview-${index + 1}`}>
                          <label className="detalle-producto-admin-edit-field">
                            <span>Descripcion {index + 1}</span>
                            <textarea
                              rows={5}
                              value={paragraph}
                              onChange={(event) =>
                                updateStringListField(
                                  "overview",
                                  index,
                                  event.target.value,
                                )
                              }
                            />
                          </label>

                          {draft.overview.length > 1 ? (
                            <RemoveItemAction
                              onClick={() => removeStringListItem("overview", index)}
                            />
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="detalle-producto-create-empty">
                        Agrega el primer parrafo de descripcion general.
                      </p>
                    )}
                  </div>
                </section>

                <section className="detalle-producto-section">
                  <CreateSectionHead
                    title="Itinerario"
                    addLabel="Agregar parada"
                    onAddItem={() =>
                      addObjectListItem("itinerary", "itinerary", {
                        day: `Paso ${draft.itinerary.length + 1}`,
                        title: "",
                        description: "",
                      })
                    }
                  />

                  <div className="detalle-producto-timeline">
                    {draft.itinerary.length ? (
                      draft.itinerary.map((item, index) => (
                        <article className="detalle-producto-timeline-item" key={item.id}>
                          <div className="detalle-producto-timeline-marker">
                            {index + 1}
                          </div>
                          <div className="detalle-producto-timeline-body">
                            <div className="detalle-producto-admin-edit-group">
                              <label className="detalle-producto-admin-edit-field">
                                <span>Etiqueta</span>
                                <input
                                  type="text"
                                  value={item.day}
                                  onChange={(event) =>
                                    updateObjectListField(
                                      "itinerary",
                                      index,
                                      "day",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>

                              <label className="detalle-producto-admin-edit-field">
                                <span>Titulo</span>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(event) =>
                                    updateObjectListField(
                                      "itinerary",
                                      index,
                                      "title",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>

                              <label className="detalle-producto-admin-edit-field">
                                <span>Descripcion</span>
                                <textarea
                                  rows={4}
                                  value={item.description}
                                  onChange={(event) =>
                                    updateObjectListField(
                                      "itinerary",
                                      index,
                                      "description",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>

                              <RemoveItemAction
                                label="Eliminar parada"
                                onClick={() => removeObjectListItem("itinerary", index)}
                              />
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="detalle-producto-create-empty">
                        Agrega la primera parada del itinerario.
                      </p>
                    )}
                  </div>
                </section>

                <section className="detalle-producto-section detalle-producto-section--surface">
                  <CreateSectionHead
                    title="Que incluye"
                    addLabel="Agregar item"
                    onAddItem={() =>
                      addObjectListItem("includes", "include", {
                        title: "",
                        description: "",
                      })
                    }
                  />

                  <div className="detalle-producto-includes">
                    {draft.includes.length ? (
                      draft.includes.map((item, index) => (
                        <article className="detalle-producto-include" key={item.id}>
                          <div className="detalle-producto-include-check" aria-hidden="true">
                            <span className="material-icons-outlined">done</span>
                          </div>
                          <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                            <label className="detalle-producto-admin-edit-field">
                              <span>Titulo</span>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(event) =>
                                  updateObjectListField(
                                    "includes",
                                    index,
                                    "title",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>

                            <label className="detalle-producto-admin-edit-field">
                              <span>Descripcion</span>
                              <textarea
                                rows={4}
                                value={item.description}
                                onChange={(event) =>
                                  updateObjectListField(
                                    "includes",
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>

                            <RemoveItemAction
                              onClick={() => removeObjectListItem("includes", index)}
                            />
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="detalle-producto-create-empty">
                        Agrega el primer elemento de que incluye.
                      </p>
                    )}
                  </div>
                </section>

                <section className="detalle-producto-section detalle-producto-section--surface">
                  <CreateSectionHead
                    title="Que no incluye"
                    addLabel="Agregar item"
                    onAddItem={() =>
                      addObjectListItem("excludes", "exclude", {
                        title: "",
                        description: "",
                      })
                    }
                  />

                  <div className="detalle-producto-includes">
                    {draft.excludes.length ? (
                      draft.excludes.map((item, index) => (
                        <article className="detalle-producto-include" key={item.id}>
                          <div
                            className="detalle-producto-include-check detalle-producto-include-check--exclude"
                            aria-hidden="true"
                          >
                            <span className="material-icons-outlined">close</span>
                          </div>
                          <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                            <label className="detalle-producto-admin-edit-field">
                              <span>Titulo</span>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(event) =>
                                  updateObjectListField(
                                    "excludes",
                                    index,
                                    "title",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>

                            <label className="detalle-producto-admin-edit-field">
                              <span>Descripcion</span>
                              <textarea
                                rows={4}
                                value={item.description}
                                onChange={(event) =>
                                  updateObjectListField(
                                    "excludes",
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>

                            <RemoveItemAction
                              onClick={() => removeObjectListItem("excludes", index)}
                            />
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="detalle-producto-create-empty">
                        Agrega el primer elemento de que no incluye.
                      </p>
                    )}
                  </div>
                </section>

                <section className="detalle-producto-section">
                  <CreateSectionHead
                    title="Recomendaciones"
                    addLabel="Agregar recomendacion"
                    onAddItem={() => addStringListItem("recommendations", "")}
                  />

                  <div className="detalle-producto-notes-list">
                    {draft.recommendations.map((item, index) => (
                      <div className="detalle-producto-admin-edit-group" key={`recommendation-${index + 1}`}>
                        <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                          <span>Recomendacion {index + 1}</span>
                          <textarea
                            rows={3}
                            value={item}
                            onChange={(event) =>
                              updateStringListField(
                                "recommendations",
                                index,
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        {draft.recommendations.length > 1 ? (
                          <RemoveItemAction
                            onClick={() =>
                              removeStringListItem("recommendations", index)
                            }
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="detalle-producto-section">
                  <CreateSectionHead
                    title="Consideraciones"
                    addLabel="Agregar consideracion"
                    onAddItem={() => addStringListItem("considerations", "")}
                  />

                  <div className="detalle-producto-notes-list">
                    {draft.considerations.map((item, index) => (
                      <div className="detalle-producto-admin-edit-group" key={`consideration-${index + 1}`}>
                        <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                          <span>Consideracion {index + 1}</span>
                          <textarea
                            rows={3}
                            value={item}
                            onChange={(event) =>
                              updateStringListField(
                                "considerations",
                                index,
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        {draft.considerations.length > 1 ? (
                          <RemoveItemAction
                            onClick={() =>
                              removeStringListItem("considerations", index)
                            }
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="detalle-producto-section">
                  <CreateSectionHead
                    title="Politicas de cancelacion"
                    addLabel="Agregar politica"
                    onAddItem={() => addStringListItem("cancellationPolicies", "")}
                  />

                  <div className="detalle-producto-notes-list">
                    {draft.cancellationPolicies.map((item, index) => (
                      <div className="detalle-producto-admin-edit-group" key={`policy-${index + 1}`}>
                        <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                          <span>Politica {index + 1}</span>
                          <textarea
                            rows={3}
                            value={item}
                            onChange={(event) =>
                              updateStringListField(
                                "cancellationPolicies",
                                index,
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        {draft.cancellationPolicies.length > 1 ? (
                          <RemoveItemAction
                            onClick={() =>
                              removeStringListItem("cancellationPolicies", index)
                            }
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="detalle-producto-sidebar">
                <ProductPriceCard
                  booking={bookingForSidebar}
                  status="inactive"
                  isEditingEnabled={true}
                  alwaysEditable={true}
                  showEditToggle={false}
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
