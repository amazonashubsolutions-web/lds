import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import ProductGalleryEditor from "../components/detalle-producto/ProductGalleryEditor";
import ProductPriceCard from "../components/detalle-producto/ProductPriceCard";
import ProductTransportPriceCard from "../components/detalle-producto/ProductTransportPriceCard";
import ProductMagicAiModal from "../components/detalle-producto/ProductMagicAiModal";
import ProductTransportMagicAiModal from "../components/detalle-producto/ProductTransportMagicAiModal";
import ProductRestaurantMagicAiModal from "../components/modals/ProductRestaurantMagicAiModal";
import ProductRestaurantPriceCard from "../components/detalle-producto/ProductRestaurantPriceCard";
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
    metaVehicleOriginal: "",
    metaCapacityOriginal: "",
    metaRestaurant: {
      foodStyle: "",
      serviceFormat: "",
      openingTime: "",
      closingTime: ""
    },
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
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(true);
  const [isTransportMagicModalOpen, setIsTransportMagicModalOpen] = useState(false);
  const [isRestaurantMagicModalOpen, setIsRestaurantMagicModalOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState(null);

  const handleMagicGenerate = async (
    category,
    {
      tourName,
      cityName,
      regionName,
      selectedSubcategory,
      aiData,
      departureTime,
      returnTime,
      departurePoint,
      pricesLow,
      pricesHigh,
      pricesLowGroup,
      pricesHighGroup,
      seasons,
      images,
    } = {}
  ) => {
    try {
      if (!aiData) return;
      
      if (images && images.length > 0) {
        setGallerySlots((current) => 
          current.map((slot, index) => {
            const imgData = images[index];
            if (imgData && imgData.file) {
              const file = imgData.file;
              return {
                ...slot,
                image: {
                  ...(slot.image || { id: `product-draft-gallery-${slot.slot + 1}` }),
                  url: createPublicGalleryUrl(file.name),
                  previewUrl: imgData.preview,
                  fileName: file.name,
                  position: slot.slot,
                  isPrimary: slot.slot === 0,
                }
              };
            }
            return slot;
          })
        );
      }
      
      setDraft((current) => {
        const newBooking = JSON.parse(JSON.stringify(current.booking));
        newBooking.price = pricesLow?.adult || current.booking.price;
        
        if (newBooking.pricingDetails?.seasons?.low?.individual && pricesLow) {
          newBooking.pricingDetails.seasons.low.individual[0].price = pricesLow.adult || "";
          newBooking.pricingDetails.seasons.low.individual[1].price = pricesLow.child || "";
          newBooking.pricingDetails.seasons.low.individual[2].price = pricesLow.baby || "";
        }
        
        if (newBooking.pricingDetails?.seasons?.low?.group && pricesLowGroup) {
          newBooking.pricingDetails.seasons.low.group[0].price = pricesLowGroup.adult || "";
          newBooking.pricingDetails.seasons.low.group[1].price = pricesLowGroup.child || "";
          newBooking.pricingDetails.seasons.low.group[2].price = pricesLowGroup.baby || "";
        }

        if (newBooking.pricingDetails?.seasons?.high?.individual && pricesHigh) {
          newBooking.pricingDetails.seasons.high.individual[0].price = pricesHigh.adult || "";
          newBooking.pricingDetails.seasons.high.individual[1].price = pricesHigh.child || "";
          newBooking.pricingDetails.seasons.high.individual[2].price = pricesHigh.baby || "";
        }

        if (newBooking.pricingDetails?.seasons?.high?.group && pricesHighGroup) {
          newBooking.pricingDetails.seasons.high.group[0].price = pricesHighGroup.adult || "";
          newBooking.pricingDetails.seasons.high.group[1].price = pricesHighGroup.child || "";
          newBooking.pricingDetails.seasons.high.group[2].price = pricesHighGroup.baby || "";
        }

        if (newBooking.pricingDetails?.seasons?.high?.periods && seasons && seasons.length > 0) {
           const newPeriods = seasons.map(s => ({
             id: createEditableItemId("period"),
             label: s.title,
             startMonthDay: s.start ? s.start.substring(5) : "",
             endMonthDay: s.end ? s.end.substring(5) : ""
           }));
           newBooking.pricingDetails.seasons.high.periods = newPeriods;
        }

        return {
          ...current,
          categoryId: category || current.categoryId,
          subcategoryId: selectedSubcategory ?? current.subcategoryId,
          title: tourName || aiData.titulo || current.title,
          city: cityName ?? current.city,
          region: regionName ?? current.region,
          
          summary: aiData.descripcion_breve || current.summary,
          overview: Array.isArray(aiData.descripcion_general) ? aiData.descripcion_general : current.overview,
          itinerary: Array.isArray(aiData.itinerario) ? aiData.itinerario.map(it => ({
            id: createEditableItemId("itinerary"),
            day: "",
            title: it.titulo || it.label || "",
            description: it.descripcion || ""
          })) : current.itinerary,
          includes: Array.isArray(aiData.que_incluye) ? aiData.que_incluye.map(item => ({
            id: createEditableItemId("include"),
            title: item.label || item.title || "",
            description: item.description || ""
          })) : current.includes,
          excludes: Array.isArray(aiData.que_no_incluye) ? aiData.que_no_incluye.map(item => ({
            id: createEditableItemId("exclude"),
            title: item.label || item.title || "",
            description: item.description || ""
          })) : current.excludes,
          recommendations: Array.isArray(aiData.recomendaciones) ? aiData.recomendaciones : current.recommendations,
          considerations: Array.isArray(aiData.consideraciones) ? aiData.consideraciones : current.considerations,
          cancellationPolicies: Array.isArray(aiData.politicas) ? aiData.politicas : current.cancellationPolicies,
          
          departureTime: departureTime !== undefined ? departureTime : current.departureTime,
          returnTime: returnTime !== undefined ? returnTime : current.returnTime,
          departurePoint: departurePoint !== undefined ? departurePoint : current.departurePoint,
          
          booking: newBooking
        };
      });
      setIsMagicModalOpen(false);
    } catch (err) {
      console.error("Error al cargar mock JSON:", err);
    }
  };

  const handleMagicStartManual = (category, { tourName, cityName, regionName, selectedSubcategory } = {}) => {
    setDraft((current) => ({ 
      ...current, 
      categoryId: category || current.categoryId,
      subcategoryId: selectedSubcategory || current.subcategoryId,
      title: tourName ?? current.title,
      city: cityName ?? current.city,
      region: regionName ?? current.region,
    }));
    setIsMagicModalOpen(false);
  };

  const handleSwitchToTransport = (initialData) => {
    setWizardInitialData(initialData);
    setIsMagicModalOpen(false);
    setIsTransportMagicModalOpen(true);
  };

  const handleSwitchToRestaurant = (initialData) => {
    setWizardInitialData(initialData);
    setIsMagicModalOpen(false);
    setIsRestaurantMagicModalOpen(true);
  };

  const handleMagicGenerateRestaurant = async (
    category,
    {
      selectedSubcategory,
      tourName,
      cityName,
      regionName,
      foodStyle,
      serviceFormat,
      openingTime,
      closingTime,
      aiData,
      pricesLow,
      pricesHigh,
      pricesLowGroup,
      pricesHighGroup,
      seasons,
      images
    } = {}
  ) => {
    try {
      if (!aiData) return;
      
      // Image Handling (Reuse logic)
      if (images && images.length > 0) {
        setGallerySlots((current) => 
          current.map((slot, index) => {
            const imgData = images[index];
            if (imgData && imgData.file) {
              const file = imgData.file;
              return {
                ...slot,
                image: {
                  ...(slot.image || { id: `product-draft-gallery-${slot.slot + 1}` }),
                  url: createPublicGalleryUrl(file.name),
                  previewUrl: imgData.preview,
                  fileName: file.name,
                  position: slot.slot,
                  isPrimary: slot.slot === 0,
                }
              };
            }
            return slot;
          })
        );
      }
      
      setDraft((current) => {
        const newBooking = JSON.parse(JSON.stringify(current.booking));
        newBooking.price = pricesLow?.adult || current.booking.price;
        
        // Price Mapping (Same as Activities)
        if (newBooking.pricingDetails?.seasons?.low?.individual && pricesLow) {
          newBooking.pricingDetails.seasons.low.individual[0].price = pricesLow.adult || "";
          newBooking.pricingDetails.seasons.low.individual[1].price = pricesLow.child || "";
          newBooking.pricingDetails.seasons.low.individual[2].price = pricesLow.baby || "";
        }
        
        if (newBooking.pricingDetails?.seasons?.low?.group && pricesLowGroup) {
          newBooking.pricingDetails.seasons.low.group[0].price = pricesLowGroup.adult || "";
          newBooking.pricingDetails.seasons.low.group[1].price = pricesLowGroup.child || "";
          newBooking.pricingDetails.seasons.low.group[2].price = pricesLowGroup.baby || "";
        }

        if (newBooking.pricingDetails?.seasons?.high?.individual && pricesHigh) {
          newBooking.pricingDetails.seasons.high.individual[0].price = pricesHigh.adult || "";
          newBooking.pricingDetails.seasons.high.individual[1].price = pricesHigh.child || "";
          newBooking.pricingDetails.seasons.high.individual[2].price = pricesHigh.baby || "";
        }

        if (newBooking.pricingDetails?.seasons?.high?.group && pricesHighGroup) {
          newBooking.pricingDetails.seasons.high.group[0].price = pricesHighGroup.adult || "";
          newBooking.pricingDetails.seasons.high.group[1].price = pricesHighGroup.child || "";
          newBooking.pricingDetails.seasons.high.group[2].price = pricesHighGroup.baby || "";
        }

        if (newBooking.pricingDetails?.seasons?.high?.periods && seasons && seasons.length > 0) {
           const newPeriods = seasons.map(s => ({
             id: createEditableItemId("period"),
             label: s.title,
             startMonthDay: s.start ? s.start.substring(5) : "",
             endMonthDay: s.end ? s.end.substring(5) : ""
           }));
           newBooking.pricingDetails.seasons.high.periods = newPeriods;
        }

        const overviewParagraphs = Array.isArray(aiData.descripcion_general) ? [...aiData.descripcion_general] : [];
        if (aiData.experiencia_servicio?.descripcion) {
          overviewParagraphs.push(aiData.experiencia_servicio.descripcion);
        }

        return {
          ...current,
          categoryId: category || current.categoryId,
          subcategoryId: selectedSubcategory ?? current.subcategoryId,
          title: aiData.titulo || tourName || current.title,
          city: cityName ?? current.city,
          region: regionName ?? current.region,
          
          summary: aiData.descripcion_breve || current.summary,
          departurePoint: aiData.ubicacion || current.departurePoint,
          overview: overviewParagraphs.length > 0 ? overviewParagraphs : current.overview,
          itinerary: Array.isArray(aiData.itinerario_basico) ? aiData.itinerario_basico.map(it => ({
            id: createEditableItemId("itinerary"),
            day: "",
            title: it.titulo || "",
            description: it.descripcion || ""
          })) : (Array.isArray(aiData.itinerario) ? aiData.itinerario.map(it => ({
            id: createEditableItemId("itinerary"),
            day: "",
            title: it.titulo || "",
            description: it.descripcion || ""
          })) : current.itinerary),
          includes: Array.isArray(aiData.que_incluye) ? aiData.que_incluye.map(item => ({
            id: createEditableItemId("include"),
            title: item.title || "",
            description: item.description || ""
          })) : current.includes,
          excludes: Array.isArray(aiData.que_no_incluye) ? aiData.que_no_incluye.map(item => ({
            id: createEditableItemId("exclude"),
            title: item.title || "",
            description: item.description || ""
          })) : current.excludes,
          recommendations: Array.isArray(aiData.recomendaciones) ? aiData.recomendaciones : current.recommendations,
          considerations: Array.isArray(aiData.consideraciones) ? aiData.consideraciones : current.considerations,
          cancellationPolicies: Array.isArray(aiData.politicas) ? aiData.politicas : current.cancellationPolicies,
          
          departureTime: openingTime !== undefined ? openingTime : current.departureTime,
          returnTime: closingTime !== undefined ? closingTime : current.returnTime,
          
          metaRestaurant: {
            foodStyle: foodStyle || "",
            serviceFormat: aiData.tipo_servicio || serviceFormat || "",
            openingTime: openingTime || "",
            closingTime: closingTime || ""
          },

          booking: newBooking
        };
      });
      setIsRestaurantMagicModalOpen(false);
    } catch (err) {
      console.error("Error al cargar mock JSON de restaurante:", err);
    }
  };

  const handleMagicGenerateTransport = async (
    category,
    {
      selectedSubcategory,
      cityName,
      vehicleType,
      capacity,
      departureTime,
      returnTime,
      aiData,
      priceLow,
      priceHigh,
      seasons,
      images
    } = {}
  ) => {
    try {
      if (!aiData) return;
      
      if (images && images.length > 0) {
        setGallerySlots((current) => 
          current.map((slot, index) => {
            const imgData = images[index];
            if (imgData && imgData.file) {
              const file = imgData.file;
              return {
                ...slot,
                image: {
                  ...(slot.image || { id: `product-draft-gallery-${slot.slot + 1}` }),
                  url: createPublicGalleryUrl(file.name),
                  previewUrl: imgData.preview,
                  fileName: file.name,
                  position: slot.slot,
                  isPrimary: slot.slot === 0,
                }
              };
            }
            return slot;
          })
        );
      }
      
      setDraft((current) => {
        const newBooking = JSON.parse(JSON.stringify(current.booking));
        newBooking.price = priceLow || current.booking.price;
        
        if (newBooking.pricingDetails?.seasons?.low?.individual && priceLow) {
          newBooking.pricingDetails.seasons.low.individual[0].price = priceLow;
        }
        
        if (newBooking.pricingDetails?.seasons?.high?.individual && priceHigh) {
          newBooking.pricingDetails.seasons.high.individual[0].price = priceHigh;
        }

        if (newBooking.pricingDetails?.seasons?.high?.periods && seasons && seasons.length > 0) {
           const newPeriods = seasons.map(s => ({
             id: createEditableItemId("period"),
             label: s.title,
             startMonthDay: s.start ? s.start.substring(5) : "",
             endMonthDay: s.end ? s.end.substring(5) : ""
           }));
           newBooking.pricingDetails.seasons.high.periods = newPeriods;
        }

        return {
          ...current,
          categoryId: category || current.categoryId,
          subcategoryId: selectedSubcategory ?? current.subcategoryId,
          title: aiData.datosGenerales?.titulo || current.title,
          city: cityName ?? current.city,
          region: current.region, // Can leave as is
          
          summary: aiData.datosGenerales?.descripcionBreve || current.summary,
          overview: Array.isArray(aiData.descripcionGeneral) ? aiData.descripcionGeneral : current.overview,
          itinerary: Array.isArray(aiData.itinerario) ? aiData.itinerario.map(it => ({
            id: createEditableItemId("itinerary"),
            day: "",
            title: it.titulo || "",
            description: it.descripcion || ""
          })) : current.itinerary,
          includes: Array.isArray(aiData.incluye) ? aiData.incluye.map(item => ({
            id: createEditableItemId("include"),
            title: item.titulo || "",
            description: item.descripcion || ""
          })) : current.includes,
          excludes: Array.isArray(aiData.noIncluye) ? aiData.noIncluye.map(item => ({
            id: createEditableItemId("exclude"),
            title: item.titulo || "",
            description: item.descripcion || ""
          })) : current.excludes,
          recommendations: Array.isArray(aiData.recomendaciones) ? aiData.recomendaciones : current.recommendations,
          considerations: Array.isArray(aiData.consideraciones) ? aiData.consideraciones : current.considerations,
          cancellationPolicies: Array.isArray(aiData.politicasCancelacion) ? aiData.politicasCancelacion : current.cancellationPolicies,
          
          departureTime: departureTime !== undefined ? departureTime : current.departureTime,
          returnTime: returnTime !== undefined ? returnTime : current.returnTime,
          
          // Meta transport specific details (will be appended during save)
          metaVehicleOriginal: vehicleType,
          metaCapacityOriginal: capacity,

          booking: newBooking
        };
      });
      setIsTransportMagicModalOpen(false);
    } catch (err) {
      console.error("Error al cargar mock JSON de transporte:", err);
    }
  };

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

  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => setFormError(""), 6000);
      return () => clearTimeout(timer);
    }
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
          label: "Vehículo",
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
      const { foodStyle, serviceFormat, openingTime, closingTime } = draft.metaRestaurant || {};
      if (foodStyle) {
        entries.push({ id: createEditableItemId("meta"), label: "Estilo", value: `Cocina ${foodStyle}` });
      }
      if (serviceFormat) {
        entries.push({ id: createEditableItemId("meta"), label: "Servicio", value: serviceFormat });
      }
      if (openingTime || closingTime) {
        entries.push({ id: createEditableItemId("meta"), label: "Horario", value: `${formatTimeToMeridiem(openingTime)} a ${formatTimeToMeridiem(closingTime)}` });
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
    navigate(`/panel-de-control/productos/${createdProductInfo.productId}`, { replace: true });
  }

  return (
    <div className="detalle-producto-page detalle-producto-page--admin">
      <PrimaryHeader />
      
      <ProductMagicAiModal 
        isOpen={isMagicModalOpen}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerate}
        onStartManual={handleMagicStartManual}
        onSwitchToTransport={handleSwitchToTransport}
        onSwitchToRestaurant={handleSwitchToRestaurant}
      />
      
      <ProductTransportMagicAiModal 
        isOpen={isTransportMagicModalOpen}
        initialData={wizardInitialData}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerateTransport}
      />

      <ProductRestaurantMagicAiModal 
        isOpen={isRestaurantMagicModalOpen}
        initialData={wizardInitialData}
        onClose={() => navigate("/panel-de-control/productos")}
        onGenerate={handleMagicGenerateRestaurant}
        onStartManual={handleMagicStartManual}
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
              <div
                style={{
                  position: "fixed",
                  bottom: "40px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#d32f2f",
                  color: "#fff",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(211,47,47,0.4)",
                  zIndex: 9999,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: "600",
                  fontSize: "1rem",
                  letterSpacing: "0.2px",
                  animation: "slideUpFade 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                }}
                role="alert"
              >
                <span className="material-icons-outlined" style={{ fontSize: "26px" }}>warning_amber</span>
                <span>{formError}</span>
                <button 
                  onClick={() => setFormError("")}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", marginLeft: "12px", display: "flex", borderRadius: "50%", padding: "4px", transition: "background 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                >
                  <span className="material-icons-outlined" style={{ fontSize: "18px" }}>close</span>
                </button>
                <style>{`
                  @keyframes slideUpFade {
                    from { transform: translate(-50%, 30px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                  }
                `}</style>
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


                    {requiresActivityTimes ? (
                      <div className="detalle-producto-create-meta-grid" style={{ display: "grid", gap: "0.9rem" }}>
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
                      </div>
                    ) : null}

                    <div className="detalle-producto-create-meta-grid" style={{ display: "grid", gap: "0.9rem" }}>
                      <label className="detalle-producto-admin-edit-field">
                        <span>Punto de encuentro</span>
                        <input
                          type="text"
                          value={draft.departurePoint}
                          onChange={(event) =>
                            handleGeneralFieldChange("departurePoint", event.target.value)
                          }
                          placeholder="Ej. Parque principal, lobby, recepcion"
                        />
                      </label>

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
                {draft.categoryId === "transporte" ? (
                  <ProductTransportPriceCard
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
                ) : draft.categoryId === "restaurantes" ? (
                  <ProductRestaurantPriceCard
                    draft={draft}
                    status="inactive"
                    isEditingEnabled={true}
                    alwaysEditable={true}
                    showEditToggle={false}
                    onBasePriceChange={updateBookingBasePrice}
                    onGridPriceChange={updateBookingGridPrice}
                    onUpdatePeriod={updateHighSeasonPeriod}
                    onAddPeriod={addHighSeasonPeriod}
                    onRemovePeriod={removeHighSeasonPeriod}
                  />
                ) : (
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
                )}
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
