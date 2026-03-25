import { buscadorNavLinks } from "./buscadorData";
import { footerData } from "./resultadosData";

export const panelControlProfile = {
  name: "Pedro Ramirez",
  level: "Explorador Gold",
  points: "42.850",
  avatar: "/images/user/hermano juanpa.jpg",
};

export const panelControlMenu = [
  { id: "perfil", label: "Configuracion de perfil", icon: "user", active: true },
  { id: "pagos", label: "Metodos de pago", icon: "card" },
  { id: "guardados", label: "Guardados", icon: "bookmark" },
  { id: "soporte", label: "Soporte", icon: "support" },
];

export const panelControlWelcome = {
  eyebrow: "Panel de control",
  title: "Bienvenido de nuevo, Pedro.",
  friends: ["/images/user/hermano juanpa.jpg", "/images/home/8.jpg", "/images/home/9.jpg"],
};

export const panelControlUpcomingTrip = {
  title: "Johnny Cay + Acuario",
  subtitle: "San Andres Islas",
  image: "/images/detalles_producto/1.jpg",
  badge: "PROXIMO • EN 12 DIAS",
  checkIn: "Abr 14, 2026",
  guests: "2 adultos",
};

export const panelControlStatus = {
  title: "Tu avance viajero",
  text: "Ya exploraste 4 destinos este anio. Estas en el top 8% de viajeros activos.",
  nextStatus: "Siguiente nivel: Platinum",
  progress: 82,
};

export const panelControlPastBookings = [
  {
    id: "cartagena",
    title: "Escapada a Cartagena",
    meta: "Completado • Ago 2025",
    image: "/images/home/1.jpg",
  },
  {
    id: "medellin",
    title: "Fin de semana en Medellin",
    meta: "Completado • Jun 2025",
    image: "/images/home/2.jpg",
  },
];

export const panelControlActivity = [
  {
    id: "cancelado",
    title: "Reserva cancelada",
    meta: "Johnny Cay • hace 3 dias",
    type: "danger",
  },
  {
    id: "wishlist",
    title: "Agregado a guardados",
    meta: "Providencia • hace 1 dia",
    type: "primary",
  },
  {
    id: "review",
    title: "Resena publicada",
    meta: "Cartagena • hace 1 semana",
    type: "warning",
  },
];

export { buscadorNavLinks, footerData };
