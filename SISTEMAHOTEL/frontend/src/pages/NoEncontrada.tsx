import { Link } from "react-router-dom";
export default function NoEncontrada() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">Página no encontrada</h1>
      <p className="mt-3 text-sm text-tinta-500">La dirección que buscas no existe o fue movida.</p>
      <Link to="/" className="btn-primario mt-8">Volver al inicio</Link>
    </div>
  );
}
