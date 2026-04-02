export const destinationHero = {
  eyebrow: "Caribe colombiano",
  title: "Santa Marta",
  subtitle: "Donde la Sierra Nevada abraza el mar",
  description:
    "Santa Marta mezcla centro historico, playas caribenas, montana, cultura y acceso directo lugares como Tayrona, Minca y la Sierra Nevada. Es una ciudad para viajeros que quieren alternar relax, naturaleza y aventura en un mismo destino.",
  ctaLabel: "Ver Galeria",
  videoLabel: "Ver video del destino",
  mosaicImages: [
    {
      src: "/images/detalles_producto/1.jpg",
      alt: "Vista costera de Santa Marta",
      className: "destino-hero-mosaic-item destino-hero-mosaic-item--primary",
    },
    {
      src: "/images/detalles_producto/2.jpg",
      alt: "Centro historico de Santa Marta",
      className: "destino-hero-mosaic-item",
    },
    {
      src: "/images/detalles_producto/3.jpg",
      alt: "Ambiente tropical y gastronomia en Santa Marta",
      className: "destino-hero-mosaic-item",
    },
  ],
};

export const destinationLogistics = {
  mapImage: "/images/detalles_producto/4.jpg",
  locationLabel: "Santa Marta, Magdalena, Colombia",
  coordinates: "11.2408 N, 74.1990 O",
  accessItems: [
    {
      icon: "flight",
      title: "Aeropuerto Simon Bolivar (SMR)",
      description:
        "A pocos minutos de El Rodadero y con conexiones frecuentes desde Bogota, Medellin y otras ciudades principales.",
    },
    {
      icon: "directions_bus",
      title: "Ingreso terrestre por la Troncal del Caribe",
      description:
        "Conexion practica con Barranquilla, Cartagena, Palomino y otros puntos de la costa norte.",
    },
  ],
  requirements: [
    "Documento de identidad vigente y reservas confirmadas en temporadas altas.",
    "Proteccion solar, hidratacion y ropa fresca para clima calido.",
    "Si visitas Tayrona o zonas de senderismo, revisa condiciones de acceso y operacion antes de viajar.",
  ],
};

export const destinationClimateCards = [
  {
    icon: "thermostat",
    value: "29 C",
    label: "Temperatura media",
    tone: "primary",
  },
  {
    icon: "air",
    value: "Brisa",
    label: "Costa caribena",
    tone: "teal",
  },
  {
    icon: "star",
    value: "Mejor epoca",
    label: "Diciembre a abril",
    tone: "highlight",
  },
  {
    icon: "sunny",
    value: "Soleado",
    label: "Gran parte del ano",
    tone: "orange",
  },
];

export const destinationActivities = [
  {
    title: "Playas y mar",
    description:
      "Disfruta bahias, atardeceres y salidas a Playa Blanca, Inca Inca o sectores cercanos al Tayrona.",
    image: "/images/detalles_producto/5.jpg",
  },
  {
    title: "Montana y naturaleza",
    description:
      "Escapate a Minca para cascadas, cafe, birdwatching y clima mas fresco en las faldas de la Sierra Nevada.",
    image: "/images/detalles_producto/6.jpg",
  },
  {
    title: "Historia y cultura",
    description:
      "Recorre la ciudad mas antigua de Colombia entre plazas, malecon, museos y patrimonio colonial.",
    image: "/images/detalles_producto/2.jpg",
  },
  {
    title: "Aventura",
    description:
      "Organiza experiencias hacia Ciudad Perdida, trekking, buceo, lanchas y rutas de naturaleza.",
    image: "/images/detalles_producto/7.jpg",
  },
];

export const destinationStayOptions = [
  {
    icon: "apartment",
    title: "Centro historico",
    description:
      "Ideal para quienes buscan vida nocturna suave, restaurantes, terrazas y acceso caminable a plazas y malecon.",
  },
  {
    icon: "beach_access",
    title: "El Rodadero y Pozos Colorados",
    description:
      "Sectores practicos para vacaciones de playa con hoteles frente al mar y salida facil al aeropuerto.",
  },
  {
    icon: "forest",
    title: "Minca y entorno natural",
    description:
      "Eco-hoteles y refugios con vista a montana para una experiencia mas tranquila y fresca.",
    highlight: true,
  },
];

export const destinationCuisineHighlights = {
  image: "/images/detalles_producto/3.jpg",
  intro:
    "La cocina samaria combina mariscos, pescado fresco, fritos caribenos, frutas tropicales y preparaciones que conectan costa y sierra.",
  dishes: [
    {
      icon: "restaurant",
      title: "Pescado frito y arroz con coco",
      description:
        "Una de las postales clasicas del destino para almuerzos frente al mar o salidas a playa.",
    },
    {
      icon: "breakfast_dining",
      title: "Cayeye y sabores locales",
      description:
        "Desayuno emblematico de la region con guineo verde, queso y mantequilla para arrancar con identidad caribena.",
    },
  ],
  recommendation:
    '"Reserva una cena al atardecer frente al mar y prueba un cayeye en desayuno para sentir el sabor local desde temprano."',
};

export const destinationTransportOptions = [
  {
    icon: "local_taxi",
    label: "Taxi o apps",
    description:
      "Una opcion practica para recorridos cortos dentro de la ciudad y traslados desde zonas turisticas.",
  },
  {
    icon: "directions_bus",
    label: "Bus y vans locales",
    description:
      "Alternativa economica para moverte entre barrios, sectores de playa y puntos urbanos de Santa Marta.",
  },
  {
    icon: "directions_boat",
    label: "Lanchas a playas",
    description:
      "Ideal para salidas hacia playas cercanas y planes costeros que se conectan mejor por mar.",
  },
];

export const destinationBudgetOptions = [
  {
    title: "Explorador",
    price: "$180.000 - $280.000",
    period: "/ dia",
    points: [
      "Hostales o hoteles sencillos",
      "Comida local y desplazamientos basicos",
      "Planes compartidos de playa o city tour",
    ],
  },
  {
    title: "Confort",
    price: "$450.000 - $750.000",
    period: "/ dia",
    points: [
      "Hoteles bien ubicados o frente al mar",
      "Restaurantes recomendados y traslados privados puntuales",
      "Excursiones privadas o escapadas a Minca y Tayrona",
    ],
    featured: true,
  },
  {
    title: "Caribe premium",
    price: "$1.100.000+",
    period: "/ dia",
    points: [
      "Hoteles boutique o resorts premium",
      "Experiencias privadas y transporte dedicado",
      "Agenda personalizada con playa, sierra y gastronomia",
    ],
  },
];

export const destinationTips = [
  {
    icon: "wb_sunny",
    title: "Sol e hidratacion",
    description:
      "El calor puede ser intenso, asi que usa bloqueador, gorra y lleva agua siempre.",
  },
  {
    icon: "forest",
    title: "Verifica accesos a naturaleza",
    description:
      "Si tu plan incluye Tayrona o caminatas, revisa horarios, cierres temporales y condiciones del operador.",
  },
  {
    icon: "warning",
    title: "Playas y corrientes",
    description:
      "Respeta indicaciones locales en el mar y elige playas habilitadas o tours con embarcaciones formales.",
    tone: "warning",
  },
  {
    icon: "currency_exchange",
    title: "Ten efectivo",
    description:
      "Aunque muchas zonas aceptan tarjeta, en trayectos pequenos y compras locales sigue siendo util llevar algo de efectivo.",
  },
];

export const destinationExpertQuote = {
  quote:
    "Santa Marta funciona mejor cuando combinas ciudad, playa y sierra con un ritmo equilibrado. No se trata de correr, sino de dejar que el Caribe marque el paso.",
  author: "Valentina Rojas",
  role: "Curadora de experiencias caribenas",
};

export const destinationGallery = [
  { src: "/images/detalles_producto/1.jpg", alt: "Panoramica costera de Santa Marta" },
  { src: "/images/detalles_producto/2.jpg", alt: "Centro historico de Santa Marta" },
  { src: "/images/detalles_producto/4.jpg", alt: "Playa y mar del Caribe samario" },
  { src: "/images/detalles_producto/6.jpg", alt: "Paisaje natural de Santa Marta" },
  { src: "/images/detalles_producto/3.jpg", alt: "Ambiente tropical y gastronomico de Santa Marta" },
  { src: "/images/detalles_producto/5.jpg", alt: "Escena costera del destino" },
  { src: "/images/detalles_producto/7.jpg", alt: "Experiencia turistica en Santa Marta" },
];

export const destinationItineraries = {
  options: [
    {
      id: "1-dia",
      label: "1 dia: Esencial",
      steps: [
        {
          step: "1",
          title: "Manana: ciudad y paseo suave",
          description:
            "Si solo tienes un dia, puedes empezar con una caminata por el centro, ver plazas, tiendas, malecon y sentir el ambiente general de la ciudad.",
        },
        {
          step: "2",
          title: "Tarde: playa a tu ritmo",
          description:
            "Despues puedes dedicar unas horas a playa. La idea es elegir una opcion cercana y sencilla para combinar mar, descanso y algo de comida local.",
        },
        {
          step: "3",
          title: "Noche: cierre tranquilo",
          description:
            "Para cerrar, una cena tranquila o un paseo nocturno por la bahia suele ser suficiente para llevarte una buena primera impresion del destino.",
        },
      ],
    },
    {
      id: "3-dias",
      label: "3 dias: Caribe completo",
      steps: [
        {
          step: "1",
          title: "Dia 1: playa",
          description:
            "Una buena idea para el primer dia es dedicarlo al mar. Puedes escoger una playa segun el ambiente que busques y tomarte el dia con calma.",
        },
        {
          step: "2",
          title: "Dia 2: ciudad y cultura",
          description:
            "El segundo dia puede enfocarse en la ciudad: centro historico, malecon, compras, cafes, gastronomia y rincones culturales.",
        },
        {
          step: "3",
          title: "Dia 3: descanso o plan flexible",
          description:
            "El tercero funciona muy bien como dia libre: repetir una playa, descansar, hacer compras finales o elegir una salida corta segun tu energia.",
        },
      ],
    },
    {
      id: "5-dias",
      label: "5 dias: Mar y sierra",
      steps: [
        {
          step: "1",
          title: "Primeros dias: base tranquila",
          description:
            "Con cinco dias ya puedes repartir mejor el viaje: uno para playa, otro para ciudad y otro para descansar sin sentir que todo va apurado.",
        },
        {
          step: "2",
          title: "Mitad del viaje: naturaleza",
          description:
            "Tambien puedes reservar un dia para naturaleza, miradores, montana o una salida diferente que contraste con el ambiente costero.",
        },
        {
          step: "3",
          title: "Ultimos dias: repetir y elegir mejor",
          description:
            "Los ultimos dias sirven para repetir lo que mas te gusto, dejar espacio al descanso y sumar algun plan especial sin que el itinerario se sienta forzado.",
        },
      ],
    },
  ],
};

export const destinationFaqs = [
  {
    question: "Cuantos dias se recomiendan para visitar Santa Marta?",
    answer:
      "Entre 3 y 5 dias funcionan muy bien para combinar centro historico, playa y una escapada a Minca o Tayrona.",
  },
  {
    question: "Cual es la mejor epoca para viajar?",
    answer:
      "La temporada seca, especialmente entre diciembre y abril, suele ser la mas buscada por clima mas estable y dias despejados.",
  },
  {
    question: "Tayrona siempre esta disponible?",
    answer:
      "No siempre. El parque puede tener cierres temporales o ajustes operativos, asi que conviene verificar disponibilidad antes de armar la ruta.",
  },
];
