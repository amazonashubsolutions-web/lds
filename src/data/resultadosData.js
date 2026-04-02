import {
  getResultsCardsFromCatalog,
  resultCategoriesFromCatalog,
} from "./productsData";

export const ALL_RESULTS_CATEGORY_ID = "all";

export const resultCategories = resultCategoriesFromCatalog;

export function getResultsCards() {
  return getResultsCardsFromCatalog();
}

export const resultsFilters = {
  priceRange: {
    step: 50000,
  },
};

export const resultsSummary = {
  title: "Resultados para: Leticia, Colombia",
  countLabel: "24 resultados encontrados para esas fechas",
  sortOptions: ["Precio: menor a mayor", "Precio: mayor a menor"],
};

export const resultsCards = getResultsCards();

export const resultsPagination = [1];

export const footerData = {
  brand: "LDS Travel",
  description:
    "Descubre planes, excursiones y experiencias turisticas en destinos colombianos con aliados locales verificados.",
  quickLinks: ["Sobre LDS", "Destinos destacados", "Centro de ayuda"],
  legal: ["Privacidad", "Terminos"],
  newsletterLabel: "Recibe novedades, ofertas y recomendaciones de viaje por Colombia.",
  copyright: "Copyright 2026 LDS Travel. Todos los derechos reservados.",
};
