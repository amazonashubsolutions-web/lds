import { footerData } from "./resultadosData";
import {
  getAllProductRecords,
  getProductLocationLabel,
  getProductRecordById,
} from "./productsData";
import { getResolvedProductGallery } from "../utils/productGalleryRepository";
import { getResolvedProductDetailContent } from "../utils/productDetailContentRepository";
import {
  getStoredCreatedProductRecordById,
  getStoredCreatedProductRecordBySlug,
} from "../utils/createdProductsRepository";

function formatCatalogPrice(value) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function buildSlugFromName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roundToThousand(value) {
  return Math.round(value / 1000) * 1000;
}

function createPriceLabel(value) {
  return formatCatalogPrice(roundToThousand(value));
}

function buildGenericPassengerPricing(basePriceAmount) {
  const adultPrice = roundToThousand(basePriceAmount);
  const childPrice = roundToThousand(basePriceAmount * 0.82);
  const babyPrice = Math.max(15000, roundToThousand(basePriceAmount * 0.12));

  return {
    low: {
      adult: adultPrice,
      child: childPrice,
      baby: babyPrice,
    },
    high: {
      adult: roundToThousand(adultPrice * 1.12),
      child: roundToThousand(childPrice * 1.12),
      baby: roundToThousand(babyPrice * 1.1),
    },
  };
}

function createGenericBookingData(product) {
  const pricing = buildGenericPassengerPricing(product.basePriceAmount);

  return {
    productId: product.id,
    price: createPriceLabel(product.basePriceAmount),
    unitLabel: `por ${product.pricingUnitLabel}`,
    buttonLabel: "Reservar ahora",
    passengerFields: [
      {
        id: "adults",
        label: "Adultos",
        min: 1,
        defaultValue: 1,
      },
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
          individual: [
            {
              id: "adults",
              label: "Valor adulto",
              price: createPriceLabel(pricing.low.adult),
            },
            {
              id: "children",
              label: "Valor nino",
              ageHint: "de 3 a 10 anos",
              price: createPriceLabel(pricing.low.child),
            },
            {
              id: "babies",
              label: "Valor bebe",
              ageHint: "de 0 a 2 anos",
              price: createPriceLabel(pricing.low.baby),
            },
          ],
          group: [
            {
              id: "adults",
              label: "Valor adulto grupo",
              price: createPriceLabel(pricing.low.adult * 0.92),
            },
            {
              id: "children",
              label: "Valor nino grupo",
              ageHint: "de 3 a 10 anos",
              price: createPriceLabel(pricing.low.child * 0.92),
            },
            {
              id: "babies",
              label: "Valor bebe grupo",
              ageHint: "de 0 a 2 anos",
              price: createPriceLabel(pricing.low.baby),
            },
          ],
        },
        high: {
          title: "Temporada alta",
          note:
            "Aplica para fechas de mayor demanda y puede variar segun la operacion del destino.",
          periods: [
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
          ],
          individual: [
            {
              id: "adults",
              label: "Valor adulto",
              price: createPriceLabel(pricing.high.adult),
            },
            {
              id: "children",
              label: "Valor nino",
              ageHint: "de 3 a 10 anos",
              price: createPriceLabel(pricing.high.child),
            },
            {
              id: "babies",
              label: "Valor bebe",
              ageHint: "de 0 a 2 anos",
              price: createPriceLabel(pricing.high.baby),
            },
          ],
          group: [
            {
              id: "adults",
              label: "Valor adulto grupo",
              price: createPriceLabel(pricing.high.adult * 0.92),
            },
            {
              id: "children",
              label: "Valor nino grupo",
              ageHint: "de 3 a 10 anos",
              price: createPriceLabel(pricing.high.child * 0.92),
            },
            {
              id: "babies",
              label: "Valor bebe grupo",
              ageHint: "de 0 a 2 anos",
              price: createPriceLabel(pricing.high.baby),
            },
          ],
        },
      },
    },
    note:
      "La operacion de la salida depende del clima, del operador y de la logistica del dia. Tasas locales, ingresos o servicios adicionales pueden cobrarse por separado.",
    additionalCharges: [
      {
        label: "Coordinacion de reserva",
        value: "10.000",
        type: "fixed",
      },
    ],
  };
}

export const productDetailRecords = [
  {
    id: "PDT-001",
    productId: 1,
    slug: "taller-cacao-caminata-minca",
    eyebrow: "Experiencia recomendada",
    galleryImageUrls: [
      "/images/home/1.jpg",
      "/images/detalles_producto/7.jpg",
      "/images/detalles_producto/6.jpg",
      "/images/detalles_producto/3.jpg",
      "/images/detalles_producto/4.jpg",
    ],
    summary:
      "Una salida de naturaleza en Minca que combina caminata suave por senderos locales con un taller artesanal de cacao. Es una experiencia pensada para conocer el entorno, entender parte del proceso del cacao y vivir una jornada relajada en la Sierra Nevada.",
    meta: [
      { id: "PDTM-001", label: "Duracion", value: "Dia completo" },
      {
        id: "PDTM-002",
        label: "Punto de encuentro",
        value: "Parque principal de Minca",
      },
      { id: "PDTM-003", label: "Hora de salida", value: "7:00 a. m." },
      { id: "PDTM-004", label: "Hora de regreso", value: "1:30 p. m." },
      {
        id: "PDTM-005",
        label: "Recorrido",
        value: "Sendero local + taller de cacao",
      },
    ],
    overview: [
      "La experiencia inicia en Minca con encuentro en punto acordado y una introduccion al recorrido del dia. Desde ahi comienza una caminata guiada por senderos de baja exigencia, pensada para disfrutar el paisaje, el clima de montana y la vegetacion del entorno.",
      "Luego el recorrido conecta con un espacio de cacao artesanal donde se comparte una explicacion general del proceso, desde la materia prima hasta la preparacion final. Dependiendo de la operacion del dia, puede incluir degustacion, demostraciones practicas y tiempo libre para fotos o compras locales.",
    ],
    includes: [
      {
        id: "PDTI-001",
        title: "Caminata guiada en entorno natural",
        description:
          "Recorrido por senderos de baja exigencia con acompanamiento basico y lectura general del paisaje local.",
      },
      {
        id: "PDTI-002",
        title: "Taller artesanal de cacao",
        description:
          "Espacio para conocer el proceso del cacao, su preparacion y algunos elementos culturales del producto en la region.",
      },
      {
        id: "PDTI-003",
        title: "Degustacion o muestra del proceso",
        description:
          "Dependiendo de la operacion, se incluye una muestra relacionada con el cacao y su transformacion artesanal.",
      },
      {
        id: "PDTI-004",
        title: "Acompanamiento de operacion",
        description:
          "Orientacion general durante el recorrido, horarios y puntos clave de la experiencia.",
      },
    ],
    excludes: [
      {
        id: "PDTE-001",
        title: "Transporte hasta Minca",
        description:
          "El traslado desde Santa Marta u otras ciudades puede manejarse aparte si el operador no lo incluye en esta salida.",
      },
      {
        id: "PDTE-002",
        title: "Alimentacion completa",
        description:
          "Snacks, bebidas y almuerzo dependen del plan contratado y pueden tener costo adicional.",
      },
      {
        id: "PDTE-003",
        title: "Compras personales",
        description:
          "Productos de cacao, recuerdos, fotografias o consumos extra no hacen parte del valor base.",
      },
      {
        id: "PDTE-004",
        title: "Servicios no descritos",
        description:
          "Cualquier servicio adicional ofrecido en destino queda sujeto a disponibilidad y pago directo.",
      },
    ],
    recommendations: [
      "Usa ropa fresca y comoda para caminar en clima de montana.",
      "Lleva hidratacion personal y protector solar.",
      "Prefiere tenis o calzado con buen agarre para sendero.",
      "Carga efectivo para compras locales o consumos adicionales.",
      "Lleva impermeable ligero si el clima cambia durante la salida.",
      "Consulta con anticipacion el punto exacto de encuentro en Minca.",
    ],
    considerations: [
      "Menores de edad deben viajar acompanados por un adulto responsable.",
      "La caminata no se recomienda para personas con movilidad muy reducida o lesiones recientes.",
      "El recorrido puede cambiar segun condiciones del clima, del sendero o de la operacion local.",
      "Conviene poder caminar tramos cortos en terreno natural y con cambios leves de desnivel.",
    ],
    cancellationPolicies: [
      "Cancelacion gratuita si se informa con al menos 7 dias de anticipacion.",
      "Reprogramaciones sujetas a disponibilidad del operador y condiciones de temporada.",
      "Si el clima o las condiciones del sendero impiden la salida, se puede reprogramar o indicar el proceso de devolucion correspondiente.",
    ],
    itinerary: [
      {
        id: "PDTIT-001",
        day: "Parada 1",
        title: "Encuentro y salida por sendero local",
        description:
          "Recepcion del grupo en Minca, indicaciones generales y comienzo del recorrido por sendero suave hacia la zona de experiencia.",
      },
      {
        id: "PDTIT-002",
        day: "Parada 2",
        title: "Interpretacion del entorno y descanso",
        description:
          "Pausa durante la caminata para apreciar el paisaje, tomar fotos y recibir contexto del territorio y sus actividades.",
      },
      {
        id: "PDTIT-003",
        day: "Parada 3",
        title: "Taller de cacao y cierre de la experiencia",
        description:
          "Ingreso al espacio artesanal de cacao, explicacion del proceso y cierre del recorrido segun el horario del dia.",
      },
    ],
    booking: {
      productId: 1,
      price: "185.000",
      unitLabel: "por persona",
      buttonLabel: "Reservar experiencia",
      passengerFields: [
        {
          id: "adults",
          label: "Adultos",
          min: 1,
          defaultValue: 1,
        },
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
        groupMinPassengers: 4,
        groupRule:
          "La tarifa de grupo aplica desde 4 pasajeros pagados en la misma reserva y en la misma fecha de salida.",
        seasons: {
          low: {
            title: "Temporada baja",
            note:
              "Aplica para fechas fuera de los periodos marcados como temporada alta.",
            individual: [
              {
                id: "adults",
                label: "Valor adulto",
                price: "185.000",
              },
              {
                id: "children",
                label: "Valor nino",
                ageHint: "de 3 a 10 anos",
                price: "155.000",
              },
              {
                id: "babies",
                label: "Valor bebe",
                ageHint: "de 0 a 2 anos",
                price: "25.000",
              },
            ],
            group: [
              {
                id: "adults",
                label: "Valor adulto grupo",
                price: "170.000",
              },
              {
                id: "children",
                label: "Valor nino grupo",
                ageHint: "de 3 a 10 anos",
                price: "142.000",
              },
              {
                id: "babies",
                label: "Valor bebe grupo",
                ageHint: "de 0 a 2 anos",
                price: "25.000",
              },
            ],
          },
          high: {
            title: "Temporada alta",
            note:
              "Aplica para fechas de mayor demanda y puede variar segun la operacion del destino.",
            periods: [
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
            ],
            individual: [
              {
                id: "adults",
                label: "Valor adulto",
                price: "210.000",
              },
              {
                id: "children",
                label: "Valor nino",
                ageHint: "de 3 a 10 anos",
                price: "178.000",
              },
              {
                id: "babies",
                label: "Valor bebe",
                ageHint: "de 0 a 2 anos",
                price: "30.000",
              },
            ],
            group: [
              {
                id: "adults",
                label: "Valor adulto grupo",
                price: "194.000",
              },
              {
                id: "children",
                label: "Valor nino grupo",
                ageHint: "de 3 a 10 anos",
                price: "164.000",
              },
              {
                id: "babies",
                label: "Valor bebe grupo",
                ageHint: "de 0 a 2 anos",
                price: "30.000",
              },
            ],
          },
        },
      },
      note:
        "La salida depende del clima, de las condiciones del sendero y de la operacion del dia. Algunos consumos, ingresos o cobros locales pueden manejarse por separado.",
      additionalCharges: [
        { label: "Coordinacion de reserva", value: "10.000", type: "fixed" },
      ],
    },
  },
];

const detailRecordByProductId = new Map(
  productDetailRecords.map((record) => [record.productId, record]),
);

const detailRecordBySlug = new Map(
  productDetailRecords.map((record) => [record.slug, record]),
);

function buildGenericDetailData(product) {
  const locationLabel = getProductLocationLabel(product);
  const categorySummary =
    product.pricingUnitLabel === "noche"
      ? "una estancia"
      : product.pricingUnitLabel === "trayecto"
        ? "un servicio de movilidad"
        : "una experiencia";

  return {
    id: `PDT-${String(product.id).padStart(3, "0")}`,
    productId: product.id,
    slug: buildSlugFromName(product.name),
    eyebrow: product.isFeatured ? "Producto destacado" : "Disponible ahora",
    galleryImageUrls: [product.coverImageUrl],
    summary: `${product.name} es ${categorySummary} disponible en ${locationLabel}, pensada para viajeros que quieren una propuesta clara y lista para reservar desde el catalogo.`,
    meta: [
      {
        id: `PDTM-${product.id}-1`,
        label: "Ubicacion",
        value: locationLabel,
      },
      {
        id: `PDTM-${product.id}-2`,
        label: "Tarifa base",
        value: `$${formatCatalogPrice(product.basePriceAmount)}`,
      },
      {
        id: `PDTM-${product.id}-3`,
        label: "Modalidad",
        value: `Por ${product.pricingUnitLabel}`,
      },
    ],
    overview: [
      `${product.name} hace parte del catalogo activo de LDS y mantiene una presentacion inicial lista para evolucionar hacia una ficha mas completa conectada a base de datos.`,
      `Mientras se completa la capa editorial, esta vista usa informacion base del producto y una estructura preparada para relacionarse por productId con reservas, cupones y futuros registros operativos.`,
    ],
    includes: [
      {
        id: `PDTI-${product.id}-1`,
        title: "Informacion base del producto",
        description:
          "La ficha toma nombre, ubicacion, tarifa base y estado desde la entidad principal de productos.",
      },
      {
        id: `PDTI-${product.id}-2`,
        title: "Preparacion para reservas",
        description:
          "El booking card ya queda conectado a un productId real para futuras validaciones de cupones y reservas.",
      },
    ],
    excludes: [
      {
        id: `PDTE-${product.id}-1`,
        title: "Contenido editorial extendido",
        description:
          "Las secciones detalladas de itinerario, politicas y recomendaciones pueden ampliarse mas adelante por producto.",
      },
    ],
    recommendations: [
      "Confirma la fecha de viaje antes de aplicar promociones.",
      "Revisa la tarifa final segun el numero de pasajeros y la temporada.",
    ],
    considerations: [
      "La informacion detallada puede ampliarse segun el producto y su operador.",
    ],
    cancellationPolicies: [
      "Las condiciones finales de cambios y cancelaciones quedaran sujetas a la politica del operador y a la configuracion de reservas.",
    ],
    itinerary: [
      {
        id: `PDTIT-${product.id}-1`,
        day: "Paso 1",
        title: "Consulta y confirmacion",
        description:
          "Selecciona fecha, pasajeros y revisa la tarifa disponible para este producto.",
      },
    ],
    booking: createGenericBookingData(product),
  };
}

function buildDetailView(record, product) {
  const resolvedGallery = getResolvedProductGallery({
    productId: product.id,
    baseImages: record.galleryImageUrls,
    fallbackCoverImageUrl: product.coverImageUrl,
  });
  const resolvedContent = getResolvedProductDetailContent(product.id, {
    title: product.name,
    summary: record.summary,
    overview: record.overview,
    itinerary: record.itinerary,
    includes: record.includes,
    excludes: record.excludes,
    recommendations: record.recommendations,
    considerations: record.considerations,
    cancellationPolicies: record.cancellationPolicies,
    booking: record.booking,
  });

  return {
    id: product.id,
    detailId: record.id,
    productId: product.id,
    slug: record.slug,
    categoryId: product.categoryId,
    title: resolvedContent.title,
    location: getProductLocationLabel(product),
    featured: product.isFeatured,
    status: product.status,
    eyebrow: record.eyebrow,
    galleryImages: resolvedGallery.map((image) => image.url),
    galleryEntries: resolvedGallery,
    summary: resolvedContent.summary,
    meta: record.meta.map(({ id, label, value }) => ({ id, label, value })),
    overview: resolvedContent.overview,
    includes: resolvedContent.includes,
    excludes: resolvedContent.excludes,
    recommendations: resolvedContent.recommendations,
    considerations: resolvedContent.considerations,
    cancellationPolicies: resolvedContent.cancellationPolicies,
    itinerary: resolvedContent.itinerary,
    booking: {
      ...resolvedContent.booking,
      productId: product.id,
    },
  };
}

function getProductRecordFromRoute(productIdOrSlug) {
  const numericProductId = Number(productIdOrSlug);

  if (!Number.isNaN(numericProductId)) {
    return getProductRecordById(numericProductId);
  }

  const matchedRecord = detailRecordBySlug.get(productIdOrSlug);

  if (!matchedRecord) {
    return getStoredCreatedProductRecordBySlug(productIdOrSlug)?.product ?? null;
  }

  return getProductRecordById(matchedRecord.productId);
}

function getResolvedDetailRecord(productIdOrSlug) {
  const productRecord = getProductRecordFromRoute(productIdOrSlug);

  if (!productRecord) {
    return null;
  }

  return detailRecordByProductId.get(productRecord.id) ?? null;
}

function buildDetailResponse(productIdOrSlug) {
  const allProducts = getAllProductRecords();
  const fallbackProduct = getProductRecordById(1) ?? allProducts[0];
  const resolvedProduct =
    getProductRecordFromRoute(productIdOrSlug) ?? fallbackProduct;
  const resolvedRecord =
    getResolvedDetailRecord(productIdOrSlug) ??
    getStoredCreatedProductRecordById(resolvedProduct.id)?.detail ??
    detailRecordByProductId.get(resolvedProduct.id) ??
    buildGenericDetailData(resolvedProduct);

  return buildDetailView(resolvedRecord, resolvedProduct);
}

function toRelatedProductItem(product) {
  return {
    id: product.id,
    title: product.name,
    location: getProductLocationLabel(product),
    image: product.coverImageUrl,
  };
}

export function getDetalleProducto(productIdOrSlug) {
  return buildDetailResponse(productIdOrSlug);
}

export function getRelatedProducts(currentProductId) {
  const currentProduct = getProductRecordById(currentProductId);
  const allProducts = getAllProductRecords();
  const sameCategoryProducts = allProducts.filter(
    (product) =>
      product.id !== Number(currentProductId) &&
      product.categoryId === currentProduct?.categoryId,
  );
  const fallbackProducts = allProducts.filter(
    (product) =>
      product.id !== Number(currentProductId) &&
      product.categoryId !== currentProduct?.categoryId,
  );

  return [...sameCategoryProducts, ...fallbackProducts]
    .slice(0, 3)
    .map(toRelatedProductItem);
}

export { footerData };
