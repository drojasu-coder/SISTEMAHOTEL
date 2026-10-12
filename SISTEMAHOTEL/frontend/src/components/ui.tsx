import { ReactNode, useState } from "react";

export function Spinner({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-tinta-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-bronce border-t-transparent" />
      {label}
    </div>
  );
}

export function Alert({ tipo = "error", children }: { tipo?: "error" | "ok" | "info"; children: ReactNode }) {
  const cls =
    tipo === "error" ? "border-error/40 bg-error/5 text-error"
    : tipo === "ok" ? "border-ok/40 bg-ok/5 text-ok"
    : "border-bronce/40 bg-bronce/5 text-bronce-700";
  return <div role={tipo === "error" ? "alert" : "status"} className={`border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="tarjeta px-6 py-12 text-center">
      <p className="font-serif text-xl">{titulo}</p>
      {texto && <p className="mx-auto mt-2 max-w-md text-sm text-tinta-500">{texto}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

/** Banner de página como los del mockup (imagen oscura con título centrado). */
export function PageHero({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <header className="bg-tinta px-6 py-14 text-center text-crema">
      <h1 className="font-serif text-4xl text-crema md:text-5xl">{titulo}</h1>
      {texto && <p className="mx-auto mt-3 max-w-xl text-sm text-crema/70">{texto}</p>}
    </header>
  );
}

export function Seccion({ titulo, texto, children, className = "" }: { titulo: string; texto?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-6xl px-6 py-12 ${className}`}>
      <h2 className="font-serif text-3xl">{titulo}</h2>
      {texto && <p className="mt-2 max-w-xl text-sm text-tinta-500">{texto}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * Foto con respaldo: si no existe el archivo en /public/img, se muestra un bloque
 * tonal en lugar de una imagen rota. Basta con copiar las fotos del mockup a public/img.
 */
export function Foto({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  const [falla, setFalla] = useState(!src);
  return falla ? (
    <div
      role="img"
      aria-label={alt}
      className={`flex items-end bg-gradient-to-br from-crema-300 via-bronce-100 to-crema-200 p-4 ${className}`}
    >
      <span className="font-serif text-sm italic text-tinta-500">{alt}</span>
    </div>
  ) : (
    <img src={src} alt={alt} loading="lazy" onError={() => setFalla(true)} className={`object-cover ${className}`} />
  );
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="etiqueta">{etiqueta}</span>
      {children}
    </label>
  );
}

/** Selector de cantidad con − y + (boletos, huéspedes, etc.). */
export function Contador({ valor, onChange, min = 0, max = 99, etiqueta }: { valor: number; onChange: (n: number) => void; min?: number; max?: number; etiqueta: string }) {
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={etiqueta}>
      <button type="button" aria-label={`Quitar ${etiqueta}`} disabled={valor <= min} onClick={() => onChange(valor - 1)} className="h-8 w-8 border border-bronce text-bronce-700 hover:bg-bronce hover:text-white disabled:opacity-40">−</button>
      <span className="w-6 text-center text-sm tabular-nums">{valor}</span>
      <button type="button" aria-label={`Agregar ${etiqueta}`} disabled={valor >= max} onClick={() => onChange(valor + 1)} className="h-8 w-8 border border-bronce text-bronce-700 hover:bg-bronce hover:text-white disabled:opacity-40">+</button>
    </div>
  );
}

export function Insignia({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "ok" | "aviso" | "error" }) {
  const c = { neutro: "border-linea text-tinta-500", ok: "border-ok/40 text-ok", aviso: "border-bronce/50 text-bronce-700", error: "border-error/40 text-error" }[tono];
  return <span className={`inline-block border px-2 py-0.5 text-xs ${c}`}>{children}</span>;
}

export const tonoEstado = (e: string): "ok" | "aviso" | "error" | "neutro" =>
  ["confirmada", "aprobado", "valido", "pagado", "emitida", "completada", "finalizada"].includes(e) ? "ok"
  : ["pendiente", "procesando", "cotizacion", "activo", "en_espera"].includes(e) ? "aviso"
  : ["cancelada", "cancelado", "rechazado", "expirada", "expirado", "anulada", "no_show"].includes(e) ? "error"
  : "neutro";
