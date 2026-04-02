import { getStoredCreatedProductRecords } from "../utils/createdProductsRepository";
import { getResolvedProductGalleryUrls } from "../utils/productGalleryRepository";
export const productCategories = [
  { id: "actividades", label: "Actividades", icon: "local_activity" },
  { id: "hospedaje", label: "Hospedaje", icon: "bed" },
  { id: "transporte", label: "Transporte", icon: "directions_car" },
  { id: "restaurantes", label: "Restaurantes", icon: "restaurant" },
  { id: "planes", label: "Planes", icon: "assignment" },
  { id: "excursiones", label: "Excursiones", icon: "explore" },
];

export const productSubcategories = [
  { id: "actividad-full-day", categoryId: "actividades", label: "Full Day" },
  { id: "actividad-media-jornada", categoryId: "actividades", label: "Media Jornada" },
  { id: "actividad-pasa-noche", categoryId: "actividades", label: "Pasa Noche" },
  { id: "actividad-pasa-dia", categoryId: "actividades", label: "Pasa Dia" },
  { id: "hospedaje-hotel", categoryId: "hospedaje", label: "Hotel" },
  { id: "hospedaje-hostel", categoryId: "hospedaje", label: "Hostel" },
  { id: "hospedaje-hotel-selva", categoryId: "hospedaje", label: "Hotel de Selva" },
  { id: "hospedaje-reserva-natural", categoryId: "hospedaje", label: "Reserva Natural" },
  { id: "transporte-alquilar-carro", categoryId: "transporte", label: "Alquilar Carro" },
  { id: "transporte-servicio-privado", categoryId: "transporte", label: "Servicio Privado" },
  { id: "transporte-alquilar-van", categoryId: "transporte", label: "Alquilar Van" },
  { id: "transporte-alquilar-bus", categoryId: "transporte", label: "Alquilar Bus" },
  { id: "transporte-alquilar-rapido", categoryId: "transporte", label: "Alquilar Rapido" },
  { id: "restaurante-desayuno", categoryId: "restaurantes", label: "Desayuno" },
  { id: "restaurante-almuerzo", categoryId: "restaurantes", label: "Almuerzo" },
  { id: "restaurante-cena", categoryId: "restaurantes", label: "Cena" },
  { id: "restaurante-refrigerios", categoryId: "restaurantes", label: "Refrigerios" },
  { id: "plan-2-noches", categoryId: "planes", label: "2 Noches" },
  { id: "plan-3-noches", categoryId: "planes", label: "3 Noches" },
  { id: "plan-4-noches", categoryId: "planes", label: "4 Noches" },
  { id: "plan-5-noches", categoryId: "planes", label: "5 Noches" },
  { id: "excursion-confort", categoryId: "excursiones", label: "Confort" },
  { id: "excursion-basico", categoryId: "excursiones", label: "Basico" },
  {
    id: "excursion-fuera-de-confort",
    categoryId: "excursiones",
    label: "Fuera de Confort",
  },
];

export const productsCatalog = [
  {
    id: 1,
    name: "Taller de cacao y caminata en Minca",
    city: "Minca",
    region: "Magdalena",
    categoryId: "actividades",
    basePriceAmount: 185000,
    currencyCode: "COP",
    isFeatured: true,
    status: "active",
    coverImageUrl: "/images/home/1.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 2,
    name: "Pasa dia termales y paisaje cultural cafetero",
    city: "Santa Rosa de Cabal",
    region: "Risaralda",
    categoryId: "actividades",
    basePriceAmount: 165000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/2.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 3,
    name: "Pasa noche de glamping y fogata en Guatavita",
    city: "Guatavita",
    region: "Cundinamarca",
    categoryId: "actividades",
    basePriceAmount: 398000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/11.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "pareja",
  },
  {
    id: 4,
    name: "Ruta de kayak media jornada en Guatape",
    city: "Guatape",
    region: "Antioquia",
    categoryId: "actividades",
    basePriceAmount: 142000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/4.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 5,
    name: "Hotel boutique en el Centro Historico",
    city: "Cartagena",
    region: "Bolivar",
    categoryId: "hospedaje",
    basePriceAmount: 540000,
    currencyCode: "COP",
    isFeatured: true,
    status: "active",
    coverImageUrl: "/images/home/5.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "noche",
  },
  {
    id: 6,
    name: "Hostel de montana para viajeros",
    city: "Salento",
    region: "Quindio",
    categoryId: "hospedaje",
    basePriceAmount: 98000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/6.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "noche",
  },
  {
    id: 7,
    name: "Hotel de selva frente al mar en Tayrona",
    city: "Santa Marta",
    region: "Magdalena",
    categoryId: "hospedaje",
    basePriceAmount: 820000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/1.jpg",
    pricingLabel: "Planes desde",
    pricingUnitLabel: "pareja",
  },
  {
    id: 8,
    name: "Reserva natural con cabanas en el Amazonas",
    city: "Leticia",
    region: "Amazonas",
    categoryId: "hospedaje",
    basePriceAmount: 690000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/2.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "noche",
  },
  {
    id: 9,
    name: "Alquiler de carro para ruta cafetera",
    city: "Armenia",
    region: "Quindio",
    categoryId: "transporte",
    basePriceAmount: 230000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/11.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "dia",
  },
  {
    id: 10,
    name: "Servicio privado Medellin - Guatape",
    city: "Medellin",
    region: "Antioquia",
    categoryId: "transporte",
    basePriceAmount: 139000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/4.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "trayecto",
  },
  {
    id: 11,
    name: "Alquiler de van para grupo familiar",
    city: "Bogota",
    region: "Cundinamarca",
    categoryId: "transporte",
    basePriceAmount: 680000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/5.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "servicio",
  },
  {
    id: 12,
    name: "Alquiler de bus para salida corporativa",
    city: "Cali",
    region: "Valle del Cauca",
    categoryId: "transporte",
    basePriceAmount: 1450000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/6.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "servicio",
  },
  {
    id: 13,
    name: "Lancha rapida para islas y playas",
    city: "Cartagena",
    region: "Bolivar",
    categoryId: "transporte",
    basePriceAmount: 310000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/1.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "cupo",
  },
  {
    id: 14,
    name: "Desayuno santandereano con vista al canion",
    city: "Mesa de los Santos",
    region: "Santander",
    categoryId: "restaurantes",
    basePriceAmount: 48000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/2.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 15,
    name: "Almuerzo tipico frente al rio",
    city: "Mompox",
    region: "Bolivar",
    categoryId: "restaurantes",
    basePriceAmount: 65000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/11.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 16,
    name: "Cena y refrigerios por Getsemani",
    city: "Cartagena",
    region: "Bolivar",
    categoryId: "restaurantes",
    basePriceAmount: 210000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/4.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 17,
    name: "Ruta de cafes y postres artesanales",
    city: "Filandia",
    region: "Quindio",
    categoryId: "restaurantes",
    basePriceAmount: 72000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/5.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 18,
    name: "Plan romantico en Barichara 2 noches",
    city: "Barichara",
    region: "Santander",
    categoryId: "planes",
    basePriceAmount: 980000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/6.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "pareja",
  },
  {
    id: 19,
    name: "Plan Islas del Rosario 3 noches",
    city: "Cartagena",
    region: "Bolivar",
    categoryId: "planes",
    basePriceAmount: 1249000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/1.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 20,
    name: "Escapada cafetera premium 4 noches",
    city: "Salento",
    region: "Quindio",
    categoryId: "planes",
    basePriceAmount: 1680000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/2.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "pareja",
  },
  {
    id: 21,
    name: "Plan Amazonas inmersivo 5 noches",
    city: "Leticia",
    region: "Amazonas",
    categoryId: "planes",
    basePriceAmount: 2450000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/11.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 22,
    name: "Expedicion Rio Amazonas confort",
    city: "Leticia",
    region: "Amazonas",
    categoryId: "excursiones",
    basePriceAmount: 285000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/4.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 23,
    name: "Excursion basica al Valle del Cocora",
    city: "Salento",
    region: "Quindio",
    categoryId: "excursiones",
    basePriceAmount: 128000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/5.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
  {
    id: 24,
    name: "Excursion fuera de confort a Cano Cristales",
    city: "La Macarena",
    region: "Meta",
    categoryId: "excursiones",
    basePriceAmount: 420000,
    currencyCode: "COP",
    isFeatured: false,
    status: "active",
    coverImageUrl: "/images/home/6.jpg",
    pricingLabel: "Desde",
    pricingUnitLabel: "persona",
  },
];

export const productSubcategoryLinks = [
  { productId: 1, subcategoryId: "actividad-full-day" },
  { productId: 1, subcategoryId: "actividad-media-jornada" },
  { productId: 2, subcategoryId: "actividad-pasa-dia" },
  { productId: 3, subcategoryId: "actividad-pasa-noche" },
  { productId: 4, subcategoryId: "actividad-media-jornada" },
  { productId: 5, subcategoryId: "hospedaje-hotel" },
  { productId: 6, subcategoryId: "hospedaje-hostel" },
  { productId: 7, subcategoryId: "hospedaje-hotel-selva" },
  { productId: 7, subcategoryId: "hospedaje-reserva-natural" },
  { productId: 8, subcategoryId: "hospedaje-reserva-natural" },
  { productId: 9, subcategoryId: "transporte-alquilar-carro" },
  { productId: 10, subcategoryId: "transporte-servicio-privado" },
  { productId: 11, subcategoryId: "transporte-alquilar-van" },
  { productId: 12, subcategoryId: "transporte-alquilar-bus" },
  { productId: 13, subcategoryId: "transporte-alquilar-rapido" },
  { productId: 14, subcategoryId: "restaurante-desayuno" },
  { productId: 15, subcategoryId: "restaurante-almuerzo" },
  { productId: 16, subcategoryId: "restaurante-cena" },
  { productId: 16, subcategoryId: "restaurante-refrigerios" },
  { productId: 17, subcategoryId: "restaurante-refrigerios" },
  { productId: 18, subcategoryId: "plan-2-noches" },
  { productId: 19, subcategoryId: "plan-3-noches" },
  { productId: 20, subcategoryId: "plan-4-noches" },
  { productId: 21, subcategoryId: "plan-5-noches" },
  { productId: 22, subcategoryId: "excursion-confort" },
  { productId: 23, subcategoryId: "excursion-basico" },
  { productId: 24, subcategoryId: "excursion-fuera-de-confort" },
];

function getResolvedProductsCatalog() {
  return [
    ...productsCatalog,
    ...getStoredCreatedProductRecords().map((record) => record.product),
  ];
}

function getResolvedProductSubcategoryLinks() {
  return [
    ...productSubcategoryLinks,
    ...getStoredCreatedProductRecords().flatMap((record) =>
      record.subcategoryIds.map((subcategoryId) => ({
        productId: record.product.id,
        subcategoryId,
      })),
    ),
  ];
}

export function getAllProductRecords() {
  return getResolvedProductsCatalog();
}

export function getProductRecordById(productId) {
  return (
    getResolvedProductsCatalog().find(
      (product) => Number(product.id) === Number(productId),
    ) ?? null
  );
}

export function getProductNameById(productId) {
  return getProductRecordById(productId)?.name ?? null;
}

export function getProductSubcategoryIds(productId) {
  return getResolvedProductSubcategoryLinks()
    .filter((relation) => Number(relation.productId) === Number(productId))
    .map((relation) => relation.subcategoryId);
}

export function getProductLocationLabel(product) {
  return `${product.city}, ${product.region}`;
}

export function getResultCategoryTree() {
  return productCategories.map((category) => ({
    ...category,
    subcategories: productSubcategories
      .filter((subcategory) => subcategory.categoryId === category.id)
      .map(({ id, label }) => ({ id, label })),
  }));
}

export function toResultCardItem(product) {
  const resolvedGallery = getResolvedProductGalleryUrls({
    productId: product.id,
    fallbackCoverImageUrl: product.coverImageUrl,
  });
  const mainImage = resolvedGallery[0] || product.coverImageUrl;

  return {
    id: product.id,
    title: product.name,
    location: getProductLocationLabel(product),
    price: product.basePriceAmount,
    status: product.status,
    featured: product.isFeatured,
    image: mainImage,
    badgeLabel: product.isFeatured ? "Destacado" : undefined,
    priceLabel: product.pricingLabel,
    priceSuffix: `/ ${product.pricingUnitLabel}`,
    categoryId: product.categoryId,
    subcategoryIds: getProductSubcategoryIds(product.id),
  };
}

export const resultCategoriesFromCatalog = getResultCategoryTree();

export function getResultsCardsFromCatalog() {
  return getResolvedProductsCatalog().map(toResultCardItem);
}

export const resultsCardsFromCatalog = getResultsCardsFromCatalog();

