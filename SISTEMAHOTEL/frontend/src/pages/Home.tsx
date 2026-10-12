import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { quetzales } from "../lib/format";
import type { TipoHabitacion } from "../lib/types";
import { Foto } from "../components/ui";

/**
 * NOTA: GET /api/tipos-habitacion exige sesión en el backend. Si el visitante no ha iniciado
 * sesión usamos estas tarifas del mockup como vista previa. Cuando el backend exponga un
 * catálogo público, este respaldo se puede eliminar.
 */
const RESPALDO: TipoHabitacion[] = [
  { id: 1, nombre: "Sencilla", capacidad_maxima: 1, tarifa_noche: "850", descripcion: null },
  { id: 2, nombre: "Doble", capacidad_maxima: 2, tarifa_noche: "1250", descripcion: null },
  { id: 3, nombre: "Suite", capacidad_maxima: 2, tarifa_noche: "2400", descripcion: null },
];
const FOTOS = ["habitacion-sencilla.jpg", "habitacion-doble.jpg", "habitacion-suite.jpg"];

const experiencias = [
  { to: "/eventos", titulo: "Eventos", texto: "Bodas, cumpleaños y reuniones ejecutivas en salones coloniales.", foto: "eventos.jpg" },
  { to: "/spa", titulo: "Spa", texto: "Masajes, sauna y circuito de bienestar con terapeutas del hotel.", foto: "spa.jpg" },
  { to: "/parque", titulo: "Parque temático", texto: "Boletos digitales con código QR para toda la familia.", foto: "parque.jpg" },
];

export default function Home() {
  const { data } = useFetch(async () => {
    try { return await api.get<TipoHabitacion[]>("/tipos-habitacion"); } catch { return RESPALDO; }
  });
  const tipos = (data && data.length ? data : RESPALDO).slice(0, 3);

  return (
    <>
      <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-tinta px-6 text-center">
        <Foto src="/img/hero.jpg" alt="Patio colonial del hotel" className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-tinta/40" />
        <div className="relative z-10 max-w-3xl text-crema">
          <p className="text-xs tracking-etiqueta text-crema/80">Guatemala · Hotel boutique de lujo</p>
          <h1 className="mt-6 font-serif text-5xl leading-tight text-crema md:text-7xl">
            Vive la experiencia <em className="text-bronce">Hunahpú</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm text-crema/85 md:text-base">
            Donde la herencia maya y el lujo contemporáneo se encuentran en el corazón de Guatemala.
          </p>
          <Link to="/habitaciones" className="btn-primario mt-9">Reserva tu estadía</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="font-serif text-4xl md:text-5xl">Habitaciones destacadas</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-tinta-500">Detalles artesanales, comodidad contemporánea y la tranquilidad de nuestros jardines.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tipos.map((t, i) => (
            <article key={t.id} className="tarjeta overflow-hidden">
              <Foto src={`/img/${FOTOS[i]}`} alt={`Habitación ${t.nombre}`} className="h-56 w-full" />
              <div className="p-6">
                <p className="text-xs text-bronce-700">{t.nombre}</p>
                <h3 className="mt-1 font-serif text-2xl">Habitación {t.nombre}</h3>
                <p className="mt-3 text-xs text-tinta-500">Hasta {t.capacidad_maxima} {t.capacidad_maxima === 1 ? "huésped" : "huéspedes"}</p>
                <p className="mt-4 font-serif text-xl">{quetzales(t.tarifa_noche)} <span className="text-sm text-tinta-500">/ noche</span></p>
                <Link to="/habitaciones" className="btn-contorno mt-5">Ver disponibilidad</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-crema-200 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-serif text-4xl md:text-5xl">Más para disfrutar</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {experiencias.map((x) => (
              <Link key={x.to} to={x.to} className="tarjeta group block overflow-hidden bg-crema-50">
                <Foto src={`/img/${x.foto}`} alt={x.titulo} className="h-48 w-full" />
                <div className="p-6">
                  <h3 className="font-serif text-2xl group-hover:text-bronce">{x.titulo}</h3>
                  <p className="mt-2 text-sm text-tinta-500">{x.texto}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
