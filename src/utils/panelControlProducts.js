import { getResultsCards, resultCategories } from "../data/resultadosData";
import { getStoredCreatedProductRecordById } from "./createdProductsRepository";
import { getResolvedProductStatus } from "./productStatusStorage";

function buildSubcategoryMap(categories) {
  return categories.reduce((accumulator, category) => {
    category.subcategories.forEach((subcategory) => {
      accumulator[subcategory.id] = subcategory.label;
    });
    return accumulator;
  }, {});
}

function getPrimaryCity(location) {
  return location.split(",")[0]?.trim() ?? location;
}

function buildDepartureDetails(item) {
  const createdRecord = getStoredCreatedProductRecordById(item.id);
  const createdMeta = createdRecord?.detail?.meta ?? [];
  const customDepartureTime =
    createdMeta.find((metaItem) => metaItem.label === "Hora de salida")?.value ?? "";
  const customDeparturePoint =
    createdMeta.find((metaItem) => metaItem.label === "Punto de encuentro")?.value ?? "";

  if (customDepartureTime || customDeparturePoint) {
    return {
      departureTime: customDepartureTime || "Por definir",
      departurePoint: customDeparturePoint || "Punto de encuentro por definir",
    };
  }

  const city = getPrimaryCity(item.location);

  if (item.categoryId === "actividades") {
    if (item.subcategoryIds.includes("actividad-pasa-noche")) {
      return {
        departureTime: "5:30 PM",
        departurePoint: `Encuentro coordinado en ${city}`,
      };
    }

    if (item.subcategoryIds.includes("actividad-media-jornada")) {
      return {
        departureTime: "7:00 AM",
        departurePoint: `Parque principal de ${city}`,
      };
    }

    return {
      departureTime: "6:00 AM",
      departurePoint: `Punto de encuentro en ${city}`,
    };
  }

  if (item.categoryId === "hospedaje") {
    return {
      departureTime: "3:00 PM",
      departurePoint: `Recepcion principal en ${city}`,
    };
  }

  if (item.categoryId === "transporte") {
    return {
      departureTime: "8:00 AM",
      departurePoint: `Terminal o punto acordado en ${city}`,
    };
  }

  if (item.categoryId === "restaurantes") {
    return {
      departureTime: "12:30 PM",
      departurePoint: `Sede principal en ${city}`,
    };
  }

  if (item.categoryId === "planes") {
    return {
      departureTime: "5:00 AM",
      departurePoint: `Lobby o punto de salida en ${city}`,
    };
  }

  return {
    departureTime: "6:30 AM",
    departurePoint: `Punto de encuentro en ${city}`,
  };
}

export function getPanelProductCardItem(item) {
  const categoryMap = Object.fromEntries(
    resultCategories.map((category) => [category.id, category.label]),
  );
  const subcategoryMap = buildSubcategoryMap(resultCategories);

  return {
    ...item,
    status: getResolvedProductStatus(item.id, item.status),
    categoryLabel: categoryMap[item.categoryId] ?? item.categoryId,
    subcategoryLabels: item.subcategoryIds.map(
      (subcategoryId) => subcategoryMap[subcategoryId] ?? subcategoryId,
    ),
    ...buildDepartureDetails(item),
  };
}

export function getPanelProductItems() {
  return getResultsCards().map(getPanelProductCardItem);
}

export function getPanelProductItemById(productId) {
  return (
    getPanelProductItems().find((item) => item.id === Number(productId)) ?? null
  );
}
