import {
  cloneBookingDraft,
  createEditableItemId,
} from "./productCreateDraft";

function mapThreePassengerPrices(target, source) {
  if (!target || !source) {
    return;
  }

  target[0].price = source.adult || "";
  target[1].price = source.child || "";
  target[2].price = source.baby || "";
}

function mapSeasonPeriods(booking, seasons) {
  if (
    !booking.pricingDetails?.seasons?.high?.periods ||
    !Array.isArray(seasons) ||
    seasons.length === 0
  ) {
    return;
  }

  booking.pricingDetails.seasons.high.periods = seasons.map((season) => ({
    id: createEditableItemId("period"),
    label: season.title,
    startMonthDay: season.start ? season.start.substring(5) : "",
    endMonthDay: season.end ? season.end.substring(5) : "",
  }));
}

function mapTimelineItems(items, resolver) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.map((item, index) => ({
    id: createEditableItemId("itinerary"),
    ...resolver(item, index),
  }));
}

function mapDetailItems(items) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.map((item) => ({
    id: createEditableItemId("include"),
    title: item.label || item.title || item.titulo || "",
    description: item.description || item.descripcion || "",
  }));
}

function mapExcludeItems(items) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.map((item) => ({
    id: createEditableItemId("exclude"),
    title: item.label || item.title || item.titulo || "",
    description: item.description || item.descripcion || "",
  }));
}

function buildActivityDraftFromAi(current, category, payload = {}) {
  const {
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
  } = payload;

  const newBooking = cloneBookingDraft(current.booking);
  newBooking.price = pricesLow?.adult || current.booking.price;
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.individual,
    pricesLow,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.group,
    pricesLowGroup,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.individual,
    pricesHigh,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.group,
    pricesHighGroup,
  );
  mapSeasonPeriods(newBooking, seasons);

  return {
    ...current,
    categoryId: category || current.categoryId,
    subcategoryId: selectedSubcategory ?? current.subcategoryId,
    title: tourName || aiData.titulo || current.title,
    city: cityName ?? current.city,
    region: regionName ?? current.region,
    summary: aiData.descripcion_breve || current.summary,
    overview: Array.isArray(aiData.descripcion_general)
      ? aiData.descripcion_general
      : current.overview,
    itinerary:
      mapTimelineItems(aiData.itinerario, (item) => ({
        day: "",
        title: item.titulo || item.label || "",
        description: item.descripcion || "",
      })) || current.itinerary,
    includes: mapDetailItems(aiData.que_incluye) || current.includes,
    excludes: mapExcludeItems(aiData.que_no_incluye) || current.excludes,
    recommendations: Array.isArray(aiData.recomendaciones)
      ? aiData.recomendaciones
      : current.recommendations,
    considerations: Array.isArray(aiData.consideraciones)
      ? aiData.consideraciones
      : current.considerations,
    cancellationPolicies: Array.isArray(aiData.politicas)
      ? aiData.politicas
      : current.cancellationPolicies,
    departureTime:
      departureTime !== undefined ? departureTime : current.departureTime,
    returnTime: returnTime !== undefined ? returnTime : current.returnTime,
    departurePoint:
      departurePoint !== undefined ? departurePoint : current.departurePoint,
    booking: newBooking,
  };
}

function buildRestaurantDraftFromAi(current, category, payload = {}) {
  const {
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
  } = payload;

  const newBooking = cloneBookingDraft(current.booking);
  newBooking.price = pricesLow?.adult || current.booking.price;
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.individual,
    pricesLow,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.group,
    pricesLowGroup,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.individual,
    pricesHigh,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.group,
    pricesHighGroup,
  );
  mapSeasonPeriods(newBooking, seasons);

  const overviewParagraphs = Array.isArray(aiData.descripcion_general)
    ? [...aiData.descripcion_general]
    : [];

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
    itinerary:
      mapTimelineItems(
        aiData.itinerario_basico || aiData.itinerario,
        (item) => ({
          day: "",
          title: item.titulo || "",
          description: item.descripcion || "",
        }),
      ) || current.itinerary,
    includes: mapDetailItems(aiData.que_incluye) || current.includes,
    excludes: mapExcludeItems(aiData.que_no_incluye) || current.excludes,
    recommendations: Array.isArray(aiData.recomendaciones)
      ? aiData.recomendaciones
      : current.recommendations,
    considerations: Array.isArray(aiData.consideraciones)
      ? aiData.consideraciones
      : current.considerations,
    cancellationPolicies: Array.isArray(aiData.politicas)
      ? aiData.politicas
      : current.cancellationPolicies,
    departureTime:
      openingTime !== undefined ? openingTime : current.departureTime,
    returnTime: closingTime !== undefined ? closingTime : current.returnTime,
    metaRestaurant: {
      foodStyle: foodStyle || "",
      serviceFormat: aiData.tipo_servicio || serviceFormat || "",
      openingTime: openingTime || "",
      closingTime: closingTime || "",
    },
    booking: newBooking,
  };
}

function buildTransportDraftFromAi(current, category, payload = {}) {
  const {
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
  } = payload;

  const newBooking = cloneBookingDraft(current.booking);
  newBooking.price = priceLow || current.booking.price;

  if (newBooking.pricingDetails?.seasons?.low?.individual && priceLow) {
    newBooking.pricingDetails.seasons.low.individual[0].price = priceLow;
  }

  if (newBooking.pricingDetails?.seasons?.high?.individual && priceHigh) {
    newBooking.pricingDetails.seasons.high.individual[0].price = priceHigh;
  }

  mapSeasonPeriods(newBooking, seasons);

  return {
    ...current,
    categoryId: category || current.categoryId,
    subcategoryId: selectedSubcategory ?? current.subcategoryId,
    title: aiData.datosGenerales?.titulo || current.title,
    city: cityName ?? current.city,
    region: current.region,
    summary: aiData.datosGenerales?.descripcionBreve || current.summary,
    overview: Array.isArray(aiData.descripcionGeneral)
      ? aiData.descripcionGeneral
      : current.overview,
    itinerary:
      mapTimelineItems(aiData.itinerario, (item) => ({
        day: "",
        title: item.titulo || "",
        description: item.descripcion || "",
      })) || current.itinerary,
    includes:
      mapTimelineItems(aiData.incluye, (item) => ({
        title: item.titulo || "",
        description: item.descripcion || "",
      }))?.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })) || current.includes,
    excludes:
      mapTimelineItems(aiData.noIncluye, (item) => ({
        title: item.titulo || "",
        description: item.descripcion || "",
      }))?.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })) || current.excludes,
    recommendations: Array.isArray(aiData.recomendaciones)
      ? aiData.recomendaciones
      : current.recommendations,
    considerations: Array.isArray(aiData.consideraciones)
      ? aiData.consideraciones
      : current.considerations,
    cancellationPolicies: Array.isArray(aiData.politicasCancelacion)
      ? aiData.politicasCancelacion
      : current.cancellationPolicies,
    departureTime:
      departureTime !== undefined ? departureTime : current.departureTime,
    returnTime: returnTime !== undefined ? returnTime : current.returnTime,
    metaVehicleOriginal: vehicleType,
    metaCapacityOriginal: capacity,
    booking: newBooking,
  };
}

function buildPlanDraftFromAi(current, category, payload = {}) {
  const {
    tourName,
    cityName,
    regionName,
    selectedSubcategory,
    aiData,
    pricesLow,
    pricesHigh,
    pricesLowGroup,
    pricesHighGroup,
    seasons,
  } = payload;

  const newBooking = cloneBookingDraft(current.booking);
  newBooking.price = pricesLow?.adult || current.booking.price;
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.individual,
    pricesLow,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.group,
    pricesLowGroup,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.individual,
    pricesHigh,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.group,
    pricesHighGroup,
  );
  mapSeasonPeriods(newBooking, seasons);

  return {
    ...current,
    categoryId: category || current.categoryId,
    subcategoryId: selectedSubcategory ?? current.subcategoryId,
    title: aiData.titulo || tourName || current.title,
    city: cityName ?? current.city,
    region: regionName ?? current.region,
    summary: aiData.descripcion_breve || current.summary,
    overview: Array.isArray(aiData.descripcion_general)
      ? aiData.descripcion_general
      : current.overview,
    itinerary:
      mapTimelineItems(aiData.itinerario, (item, index) => ({
        day: item.day || item.label || `Dia ${index + 1}`,
        title: item.titulo || item.title || "",
        description: item.descripcion || item.description || "",
      })) || current.itinerary,
    includes: mapDetailItems(aiData.que_incluye) || current.includes,
    excludes: mapExcludeItems(aiData.que_no_incluye) || current.excludes,
    recommendations: Array.isArray(aiData.recomendaciones)
      ? aiData.recomendaciones
      : current.recommendations,
    considerations: Array.isArray(aiData.consideraciones)
      ? aiData.consideraciones
      : current.considerations,
    cancellationPolicies: Array.isArray(aiData.politicas)
      ? aiData.politicas
      : current.cancellationPolicies,
    booking: newBooking,
  };
}

function buildExcursionDraftFromAi(current, category, payload = {}) {
  const {
    tourName,
    cityName,
    regionName,
    selectedSubcategory,
    aiData,
    pricesLow,
    pricesHigh,
    pricesLowGroup,
    pricesHighGroup,
    seasons,
  } = payload;

  const newBooking = cloneBookingDraft(current.booking);
  newBooking.price = pricesLow?.adult || current.booking.price;
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.individual,
    pricesLow,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.low?.group,
    pricesLowGroup,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.individual,
    pricesHigh,
  );
  mapThreePassengerPrices(
    newBooking.pricingDetails?.seasons?.high?.group,
    pricesHighGroup,
  );
  mapSeasonPeriods(newBooking, seasons);

  return {
    ...current,
    categoryId: category || current.categoryId,
    subcategoryId: selectedSubcategory ?? current.subcategoryId,
    title: aiData.titulo || tourName || current.title,
    city: cityName ?? current.city,
    region: regionName ?? current.region,
    summary: aiData.descripcion_breve || current.summary,
    overview: Array.isArray(aiData.descripcion_general)
      ? aiData.descripcion_general
      : current.overview,
    itinerary:
      mapTimelineItems(aiData.itinerario, (item, index) => ({
        day: item.day || item.label || `Dia ${index + 1}`,
        title: item.titulo || item.title || "",
        description: item.descripcion || item.description || "",
      })) || current.itinerary,
    includes: mapDetailItems(aiData.que_incluye) || current.includes,
    excludes: mapExcludeItems(aiData.que_no_incluye) || current.excludes,
    recommendations: Array.isArray(aiData.recomendaciones)
      ? aiData.recomendaciones
      : current.recommendations,
    considerations: Array.isArray(aiData.consideraciones)
      ? aiData.consideraciones
      : current.considerations,
    cancellationPolicies: Array.isArray(aiData.politicas)
      ? aiData.politicas
      : current.cancellationPolicies,
    booking: newBooking,
  };
}

export {
  buildActivityDraftFromAi,
  buildExcursionDraftFromAi,
  buildPlanDraftFromAi,
  buildRestaurantDraftFromAi,
  buildTransportDraftFromAi,
};
