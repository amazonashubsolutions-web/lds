import { footerData, resultsCards } from "./resultadosData";

const galleryImages = [
  "/images/detalles_producto/1.jpg",
  "/images/detalles_producto/2.jpg",
  "/images/detalles_producto/3.jpg",
  "/images/detalles_producto/4.jpg",
  "/images/detalles_producto/5.jpg",
];

const relatedGalleryImages = [
  "/images/detalles_producto/6.jpg",
  "/images/detalles_producto/7.jpg",
];

const includes = [
  {
    title: "Alojamiento premium",
    description: "Habitaciones seleccionadas, desayuno diario y amenities de bienvenida.",
  },
  {
    title: "Traslados coordinados",
    description: "Recogida privada, traslados internos y acompanamiento logistico.",
  },
  {
    title: "Experiencias locales",
    description: "Actividades guiadas, recomendaciones y acceso a puntos destacados.",
  },
  {
    title: "Asistencia durante el viaje",
    description: "Soporte por mensaje para ajustes, horarios y recomendaciones.",
  },
];

const itinerary = [
  {
    day: "Dia 1",
    title: "Llegada y primer recorrido",
    description:
      "Recepcion, traslado al alojamiento y una primera inmersion en el destino con paradas fotograficas.",
  },
  {
    day: "Dia 2",
    title: "Experiencia principal",
    description:
      "Jornada de actividad guiada con tiempos libres, gastronomia y puntos iconicos del recorrido.",
  },
  {
    day: "Dia 3",
    title: "Cierre flexible",
    description:
      "Manana libre, recomendaciones personalizadas y coordinacion de salida segun el itinerario.",
  },
];

const reviews = [
  {
    initials: "MR",
    author: "Maria R.",
    meta: "viaje en pareja",
    text: "La experiencia estuvo muy bien organizada. El ritmo, la atencion y las vistas justifican totalmente la reserva.",
  },
  {
    initials: "JC",
    author: "Juan C.",
    meta: "escapada corta",
    text: "Todo se sintio claro y bien resuelto desde la llegada. Es un formato ideal para quien quiere viajar sin complicaciones.",
  },
];

const detailOverrides = {
  1: {
    eyebrow: "Seleccion editorial",
    summary:
      "Una propuesta pensada para viajeros que priorizan ubicacion, vistas y una experiencia bien curada desde el primer dia.",
  },
  2: {
    eyebrow: "Mas reservado",
    summary:
      "Una opcion equilibrada entre comodidad, acceso al destino y una agenda flexible para aprovechar el viaje.",
  },
  3: {
    eyebrow: "Vista destacada",
    summary:
      "Ideal para quien busca un ritmo mas pausado, buenas postales y una estancia con caracter.",
  },
  4: {
    eyebrow: "Escapada sugerida",
    summary:
      "Pensado para escapadas breves con buena conectividad, actividades principales y tiempos libres bien distribuidos.",
  },
  5: {
    eyebrow: "Alta gama",
    summary:
      "Una experiencia premium con mas privacidad, mejor servicio y una propuesta visual de mayor impacto.",
  },
  6: {
    eyebrow: "Recomendado",
    summary:
      "Una alternativa practica para quienes valoran ubicacion, claridad en la reserva y una experiencia confiable.",
  },
};

export function getDetalleProducto(productId) {
  const numericId = Number(productId);
  const baseCard = resultsCards.find((item) => item.id === numericId) ?? resultsCards[0];
  const override = detailOverrides[baseCard.id] ?? detailOverrides[1];

  return {
    id: baseCard.id,
    title: baseCard.title,
    location: baseCard.location,
    rating: baseCard.rating,
    featured: baseCard.featured,
    eyebrow: override.eyebrow,
    reviewsCount: 124,
    galleryImages,
    summary: override.summary,
    meta: [
      { label: "Duracion", value: "3 dias / 2 noches" },
      { label: "Modalidad", value: "Experiencia guiada" },
      { label: "Disponibilidad", value: "Salidas programadas" },
    ],
    overview: [
      "Este detalle combina alojamiento, recorridos y soporte operativo en una sola experiencia. La idea no es solo reservar, sino reducir friccion en la planeacion y dejar clara la propuesta de valor desde la primera vista.",
      "La seleccion de actividades, tiempos y servicios esta pensada para mantener una experiencia consistente, con margen de personalizacion segun el ritmo del viajero.",
    ],
    includes,
    itinerary,
    reviews,
    booking: {
      price: baseCard.price,
      note: "No se requiere pago hoy. Cancelacion flexible segun disponibilidad.",
      breakdown: [
        { label: "Experiencia base", value: `$${baseCard.price * 2}` },
        { label: "Coordinacion y soporte", value: "$120" },
        { label: "Impuestos estimados", value: "$90" },
      ],
      total: `$${baseCard.price * 2 + 210}`,
    },
  };
}

export function getRelatedProducts(currentId) {
  return resultsCards
    .filter((item) => item.id !== Number(currentId))
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      image: relatedGalleryImages[index] ?? item.image,
    }));
}

export { footerData };
