import { footerData } from "./resultadosData";

const johnnyCayGalleryImages = [
  "/images/detalles_producto/1.jpg",
  "/images/detalles_producto/2.jpg",
  "/images/detalles_producto/3.jpg",
  "/images/detalles_producto/4.jpg",
  "/images/detalles_producto/5.jpg",
];

const relatedProducts = [
  {
    id: "vuelta-isla",
    title: "Vuelta a la isla de San Andres",
    location: "San Andres Islas, Colombia",
    image: "/images/detalles_producto/6.jpg",
  },
  {
    id: "rocky-cay",
    title: "Rocky Cay y San Luis",
    location: "San Andres Islas, Colombia",
    image: "/images/detalles_producto/7.jpg",
  },
  {
    id: "manglares",
    title: "Manglares y bahia interior",
    location: "San Andres Islas, Colombia",
    image: "/images/home/10.jpg",
  },
];

const detailProducts = {
  default: {
    id: "johnny-cay-acuario",
    title: "Paseo Johnny Cay + Acuario",
    location: "San Andres Islas, Colombia",
    rating: 4.8,
    featured: true,
    eyebrow: "Plan recomendado",
    reviewsCount: 187,
    galleryImages: johnnyCayGalleryImages,
    summary:
      "Un recorrido clasico de San Andres para conocer Johnny Cay, disfrutar tiempo libre de playa y continuar hacia Acuario con aguas poco profundas, peces de colores y vista a Haynes Cay.",
    meta: [
      { label: "Duracion", value: "Dia completo" },
      { label: "Salida", value: "Muelle principal" },
      { label: "Recorrido", value: "Johnny Cay + Acuario" },
    ],
    overview: [
      "Este paseo combina dos de los puntos mas conocidos de San Andres en una misma salida. Primero se realiza el traslado en lancha hacia Johnny Cay, un islote de arena blanca y palmeras donde normalmente se deja tiempo libre para caminar, descansar y disfrutar del ambiente de playa.",
      "Despues el recorrido continua hacia Acuario, tambien conocido como Rose Cay, una zona de mar poco profundo y agua transparente donde suele ser posible observar peces y, cuando las condiciones lo permiten, caminar hacia Haynes Cay. La operacion del tour puede variar segun el clima, el estado del mar y las indicaciones del parque.",
    ],
    includes: [
      {
        title: "Traslado maritimo ida y vuelta",
        description:
          "Salida en lancha compartida desde el muelle con recorrido hacia Johnny Cay y la zona de Acuario.",
      },
      {
        title: "Tiempo libre en Johnny Cay",
        description:
          "Espacio para disfrutar de playa, fotos, caminatas cortas y ambiente isleno dentro del tiempo del tour.",
      },
      {
        title: "Parada en Acuario",
        description:
          "Visita a la zona de aguas cristalinas y poca profundidad para banarse y recorrer el sector.",
      },
      {
        title: "Coordinacion del operador",
        description:
          "Organizacion general del paseo y orientacion basica sobre embarque, horarios y puntos de encuentro.",
      },
    ],
    itinerary: [
      {
        day: "Parada 1",
        title: "Embarque y salida desde San Andres",
        description:
          "Registro con el operador, indicaciones de embarque y salida en lancha hacia Johnny Cay en la franja de la manana.",
      },
      {
        day: "Parada 2",
        title: "Tiempo libre en Johnny Cay",
        description:
          "Llegada al cayo para disfrutar del entorno, caminar por la playa, tomar fotos y usar el tiempo libre segun el ritmo del viajero.",
      },
      {
        day: "Parada 3",
        title: "Acuario y regreso",
        description:
          "Traslado a Acuario para bano y recorrido en aguas bajas. Si las condiciones son favorables, se aprecia la conexion visual hacia Haynes Cay antes del regreso.",
      },
    ],
    reviews: [
      {
        initials: "LM",
        author: "Laura M.",
        meta: "viaje familiar",
        text: "Johnny Cay tiene el paisaje clasico que uno espera de San Andres y Acuario fue la parte mas divertida por el color del agua. El plan se siente completo para un dia.",
      },
      {
        initials: "CR",
        author: "Carlos R.",
        meta: "pareja",
        text: "La combinacion de las dos paradas funciona muy bien. Recomiendo ir temprano, llevar protector solar y confirmar con el operador el punto exacto de salida.",
      },
    ],
    booking: {
      price: "82.800",
      unitLabel: "por persona",
      buttonLabel: "Reservar paseo",
      note:
        "El ingreso a Johnny Cay puede depender del clima y del estado del mar. El impuesto ecologico y las tasas de muelle pueden cobrarse por separado segun el operador del dia.",
      breakdown: [
        { label: "Paseo base (2 viajeros)", value: "$165.600" },
        { label: "Coordinacion de reserva", value: "$8.000" },
        { label: "Impuesto ecologico no incluido", value: "Pago en muelle" },
      ],
      total: "$173.600",
    },
  },
};

export function getDetalleProducto(productId) {
  return detailProducts[productId] ?? detailProducts.default;
}

export function getRelatedProducts(currentId) {
  return relatedProducts.filter((item) => item.id !== currentId).slice(0, 3);
}

export { footerData };
