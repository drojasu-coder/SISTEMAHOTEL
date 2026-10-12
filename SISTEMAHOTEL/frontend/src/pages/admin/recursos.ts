/** Catálogo de secciones del panel y el endpoint del backend que alimenta cada una. */
export interface RecursoDef {
  slug: string;
  titulo: string;
  endpoint: string;
  /** Si la sección permite cambiar el estado, ruta (relativa al id) y estados válidos del backend. */
  estados?: { ruta: string; opciones: string[] };
  /** Pagos: botón para aprobar transferencias. */
  pagos?: boolean;
  nota?: string;
}

export const RECURSOS: RecursoDef[] = [
  { slug: "reservas", titulo: "Reservas", endpoint: "/reservas-habitacion" },
  { slug: "habitaciones", titulo: "Habitaciones", endpoint: "/habitaciones" },
  { slug: "eventos", titulo: "Eventos", endpoint: "/reservas-evento" },
  { slug: "restaurante", titulo: "Restaurante", endpoint: "/reservas-mesa", estados: { ruta: "estado", opciones: ["confirmada", "cancelada"] } },
  { slug: "actividades", titulo: "Actividades", endpoint: "/reservas-actividad", estados: { ruta: "estado", opciones: ["confirmada", "cancelada", "completada"] } },
  { slug: "amenidades", titulo: "Amenidades", endpoint: "/reservas-amenidad", estados: { ruta: "estado", opciones: ["cancelada", "usada"] } },
  { slug: "spa", titulo: "Spa", endpoint: "/citas-spa", estados: { ruta: "estado", opciones: ["confirmada", "cancelada", "completada"] } },
  { slug: "parque", titulo: "Parque temático", endpoint: "/boletos-parque", estados: { ruta: "estado", opciones: ["valido", "usado", "cancelado"] } },
  { slug: "transporte", titulo: "Transporte", endpoint: "/reservas-transporte" },
  { slug: "pagos", titulo: "Pagos", endpoint: "/pagos", pagos: true },
  { slug: "promociones", titulo: "Promociones", endpoint: "/promociones" },
  { slug: "facturacion", titulo: "Facturación", endpoint: "/facturas" },
  { slug: "personal", titulo: "Personal", endpoint: "/empleados" },
  { slug: "proveedores", titulo: "Proveedores", endpoint: "/proveedores" },
  { slug: "usuarios", titulo: "Usuarios y roles", endpoint: "/usuarios" },
  { slug: "reportes", titulo: "Reportes", endpoint: "", nota: "Los reportes y métricas (requerimientos 21 y 22) aún no tienen endpoints en el backend." },
  { slug: "metricas", titulo: "Métricas", endpoint: "", nota: "Las métricas del dashboard aún no tienen endpoints en el backend." },
];
