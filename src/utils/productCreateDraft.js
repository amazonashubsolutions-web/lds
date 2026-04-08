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

const PRICING_UNIT_OPTIONS = [
  { value: "persona", label: "Persona" },
  { value: "pareja", label: "Pareja" },
  { value: "noche", label: "Noche" },
  { value: "dia", label: "Dia" },
  { value: "trayecto", label: "Trayecto" },
  { value: "servicio", label: "Servicio" },
  { value: "cupo", label: "Cupo" },
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
      closingTime: "",
    },
    booking: createBookingDraft("persona"),
  };
}

function createPublicGalleryUrl(fileName) {
  return `/images/productos/${encodeURIComponent(fileName)}`;
}

function cloneBookingDraft(booking) {
  return JSON.parse(JSON.stringify(booking));
}

function mapWizardImagesToGallerySlots(currentSlots, images = []) {
  if (!Array.isArray(images) || images.length === 0) {
    return currentSlots;
  }

  return currentSlots.map((slot, index) => {
    const imageData = images[index];

    if (!imageData?.file) {
      return slot;
    }

    const file = imageData.file;

    return {
      ...slot,
      image: {
        ...(slot.image || { id: `product-draft-gallery-${slot.slot + 1}` }),
        url: createPublicGalleryUrl(file.name),
        previewUrl: imageData.preview,
        fileName: file.name,
        position: slot.slot,
        isPrimary: slot.slot === 0,
      },
    };
  });
}

export {
  DEFAULT_HIGH_SEASON_PERIODS,
  PRICING_UNIT_OPTIONS,
  buildSlugFromName,
  cloneBookingDraft,
  createBookingDraft,
  createEditableItemId,
  createInitialDraft,
  createPublicGalleryUrl,
  formatTimeToMeridiem,
  mapWizardImagesToGallerySlots,
  normalizeText,
  sanitizePriceValue,
};
