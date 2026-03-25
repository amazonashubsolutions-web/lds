export const resultCategoryChips = [
  { id: "stays", label: "Hospedajes", icon: "bed", active: true },
  { id: "flights", label: "Vuelos", icon: "flight" },
  { id: "cars", label: "Alquiler de autos", icon: "directions_car" },
  { id: "attractions", label: "Atracciones", icon: "explore" },
  { id: "taxis", label: "Taxis al aeropuerto", icon: "local_taxi" },
];

export const resultsFilters = {
  priceRange: {
    minLabel: "$0",
    maxLabel: "$2,500+",
    value: 35,
  },
  guestRatings: ["Excepcional: 9+", "Excelente: 8+", "Muy bueno: 7+"],
  amenities: ["Wi-Fi gratis", "Piscina", "Gimnasio"],
  tripDuration: ["1-3 noches", "4-7 noches"],
};

export const resultsSummary = {
  title: "Resultados para: Leticia, Colombia",
  countLabel: "342 resultados encontradas para esas fechas ",
  sortOptions: [
    "Mejores opciones",
    "Precio: menor a mayor",
    "Calificacion de huespedes",
    "Distancia al centro",
  ],
};

export const resultsCards = [
  {
    id: 1,
    title: "Villa Poseidon Luxury Suites",
    location: "Positano, Italy",
    price: 450,
    rating: 4.9,
    featured: true,
    image: "/images/home/1.jpg",
  },
  {
    id: 2,
    title: "Grand Hotel Excelsior",
    location: "Amalfi, Italy",
    price: 320,
    rating: 4.7,
    image: "/images/home/2.jpg",
  },
  {
    id: 3,
    title: "Ravello Heights Boutique",
    location: "Ravello, Italy",
    price: 290,
    rating: 4.8,
    image: "/images/home/11.jpg",
  },
  {
    id: 4,
    title: "Casa del Sole Apartments",
    location: "Praiano, Italy",
    price: 180,
    rating: 4.6,
    image: "/images/home/4.jpg",
  },
  {
    id: 5,
    title: "Belmond Hotel Caruso",
    location: "Ravello, Italy",
    price: 890,
    rating: 5.0,
    image: "/images/home/5.jpg",
  },
  {
    id: 6,
    title: "Marina Riviera Hotel",
    location: "Amalfi, Italy",
    price: 210,
    rating: 4.5,
    image: "/images/home/6.jpg",
  },
];

export const resultsPagination = [1, 2, 3];

export const footerData = {
  brand: "Voyager",
  description:
    "Elevating the travel experience through curation and editorial excellence. Discover the world's most breathtaking stays and itineraries.",
  quickLinks: ["About Our Story", "Editorial Policy", "Help Center"],
  legal: ["Privacy", "Terms"],
  newsletterLabel: "Subscribe for curated travel inspiration.",
  copyright: "© 2024 The Editorial Voyager. Curated Travel Excellence.",
};
