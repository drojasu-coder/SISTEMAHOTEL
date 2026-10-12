# Hotel Hunahpú — Frontend

React + Vite + TypeScript + Tailwind. Se conecta al backend de `SISTEMAHOTEL/backend` (Express, puerto 4000).

## Cómo correrlo

```bash
# 1. Backend y base de datos (como ya lo tienen)
docker compose up -d
cd backend && npm run dev          # http://localhost:4000

# 2. Frontend
cd frontend
cp .env.example .env               # pega tu clave PUBLICABLE de Stripe (pk_test_...)
npm install
npm run dev                        # http://localhost:5173
```

En desarrollo, Vite reenvía `/api/*` a `http://localhost:4000`, así que no hay problemas de CORS.
Para pagos con tarjeta, en otra terminal reenvía los webhooks de Stripe al backend
(`stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook`); sin eso el pago
queda en "procesando" porque el backend lo aprueba solo cuando llega el webhook.

## Fotos del mockup

Copia las fotos a `public/img/` con estos nombres (si falta alguna se muestra un bloque de color):
`hero.jpg`, `habitacion-sencilla.jpg`, `habitacion-doble.jpg`, `habitacion-suite.jpg`, `habitacion-familiar.jpg`,
`eventos.jpg`, `spa.jpg`, `parque.jpg`, `salon-1.jpg`…`salon-3.jpg`,
`restaurante-interior.jpg`, `restaurante-terraza.jpg`, `restaurante-bar.jpg`,
`actividad-golf.jpg`, `actividad-tenis.jpg`, `actividad-billar.jpg`, `amenidad-<id>.jpg`, `spa-<id>.jpg`.

## Estructura

```
src/
  lib/        api.ts (fetch + token + errores), types.ts, format.ts, config.ts, useFetch.ts
  context/    AuthContext (login/registro/sesión), CartContext (carrito activo)
  components/ Navbar, Layout, Guard (rutas protegidas), RequiereCliente, ui (piezas comunes)
  pages/      Home, Login, Registro, Habitaciones, Eventos, Restaurante, Actividades,
              Amenidades, Spa, Parque, Carrito, Checkout, cuenta/*, admin/*
```

## Flujo de compra (tal como lo exige el backend)

1. El cliente crea la **reserva** del servicio (el precio lo calcula el servidor).
2. La reserva se agrega al **carrito** (`POST /carritos/:id/items`).
3. `/checkout` pide `GET /pagos/resumen`, crea el pago (`POST /pagos`) y, si es tarjeta,
   monta Stripe Payment Element con el `client_secret`; luego consulta `GET /pagos/:id`
   hasta que el webhook lo marque aprobado o rechazado.

## Limitaciones conocidas (dependen del backend)

Ver el resumen de la conversación: faltan endpoints de disponibilidad por fechas, horarios libres,
"mis reservas" para mesa/actividad/amenidad/spa/parque, precios de mesa/actividad/amenidad/transporte,
edición de perfil y datos fiscales, reportes/métricas, y un catálogo público de habitaciones.
