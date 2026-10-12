import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import salonRoutes from "./routes/eventos/salon.routes";
import usuarioRoutes from "./routes/usuarios/usuario.routes";
import reservaEventoRoutes from "./routes/eventos/reservaEvento.routes";
import reservaEventoServicioRoutes from "./routes/eventos/reservaEventoServicio.routes";
import empleadoRoutes from "./routes/personal/empleado.route";
import turnoRoutes from "./routes/personal/turno.routes";
import choferRoutes from "./routes/transporte/chofer.routes";
import vehiculoRoutes from "./routes/transporte/vehiculo.routes";
import reservaTransporteRoutes from "./routes/transporte/reservaTransporte.routes";
import carritoRoutes from "./routes/carrito/carrito.routes";
import carritoItemsRoutes from "./routes/carrito/carritoItem.routes";

import sucursalRoutes from "./routes/sucursales/sucursal.routes";

import mesaRoutes from "./routes/restaurante/mesa.routes";
import reservaMesaRoutes from "./routes/restaurante/reservaMesa.routes";

import recursoActividadRoutes from "./routes/actividades/recursoActividad.routes";
import instructorRoutes from "./routes/actividades/instructor.routes";
import reservaActividadRoutes from "./routes/actividades/reservaActividad.routes";

import amenidadRoutes from "./routes/amenidades/amenidad.routes";
import reservaAmenidadRoutes from "./routes/amenidades/reservaAmenidad.routes";

import terapeutaRoutes from "./routes/bienestar/terapeuta.routes";
import servicioSpaRoutes from "./routes/bienestar/servicioSpa.routes";
import citaSpaRoutes from "./routes/bienestar/citaSpa.routes";

import boletoParqueRoutes from "./routes/parque/boletoParque.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import servicioEventoRoutes from "./routes/eventos/servicioEvento.routes";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import tipoHabitacionRoutes from "./routes/habitaciones/tipoHabitacion.routes";
import habitacionRoutes from "./routes/habitaciones/habitacion.routes";
import parqueoRoutes from "./routes/habitaciones/parqueo.routes";
import reservaHabitacionRoutes from "./routes/habitaciones/reservaHabitacion.routes";
import reservaParqueoRoutes from "./routes/habitaciones/reservaParqueo.routes";
import promocionRoutes from "./routes/habitaciones/promocion.routes";
import facturaRoutes from "./routes/habitaciones/factura.routes";
import facturaItemRoutes from "./routes/habitaciones/facturaItem.routes";
import configuracionRoutes from "./routes/configuracion.routes";
import proveedorRoutes from "./routes/proveedores/proveedor.routes";
import proveedorProductoRoutes from "./routes/proveedores/proveedorProducto.routes";
import cuentaPorPagarRoutes from "./routes/proveedores/cuentaPorPagar.routes";
import pagoRoutes from "./routes/pagos/pago.routes";
import { stripeWebhook } from "./controllers/pagos/pago.controller";

const app = express();

app.use(cors());

/**
 * @openapi
 * /api/pagos/stripe/webhook:
 *   post:
 *     tags:
 *       - Stripe Webhook
 *     summary: Recibe eventos de Stripe
 *     description: Endpoint para recibir webhooks de Stripe. Verifica la firma con Stripe-Signature y no usa autenticación JWT.
 *     security: []
 *     parameters:
 *       - in: header
 *         name: Stripe-Signature
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Evento procesado correctamente
 *       400:
 *         description: Firma inválida o cuerpo mal formado
 *       500:
 *         description: Error al procesar el evento
 */
// Stripe signature verification requires the untouched request bytes.
app.post("/api/pagos/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }),
);

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verifica el estado del servidor
 *     description: Retorna 200 OK si el servidor está en funcionamiento.
 *     security: []
 *     responses:
 *       200:
 *         description: Servidor funcionando
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "API de Hotel está funcionando correctamente"
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "API de Hotel está funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/servicios-evento", servicioEventoRoutes);

app.use("/api/habitaciones", habitacionRoutes);
app.use("/api/tipos-habitacion", tipoHabitacionRoutes);
app.use("/api/parqueos", parqueoRoutes);
app.use("/api/reservas-habitacion", reservaHabitacionRoutes);
app.use("/api/reservas-parqueo", reservaParqueoRoutes);
app.use("/api/promociones", promocionRoutes);
app.use("/api/facturas", facturaRoutes);
app.use("/api/factura-items", facturaItemRoutes);
app.use("/api/configuraciones", configuracionRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/proveedor-productos", proveedorProductoRoutes);
app.use("/api/cuentas-por-pagar", cuentaPorPagarRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/salones", salonRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/reservas-evento", reservaEventoRoutes);
app.use(
  "/api/reservas-evento/:reservaId/servicios",
  reservaEventoServicioRoutes,
);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/turnos", turnoRoutes);
app.use("/api/choferes", choferRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/reservas-transporte", reservaTransporteRoutes);
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/mesas", mesaRoutes);
app.use("/api/recursos-actividad", recursoActividadRoutes);
app.use("/api/instructores", instructorRoutes);
app.use("/api/reservas-actividad", reservaActividadRoutes);
app.use("/api/amenidades", amenidadRoutes);
app.use("/api/reservas-amenidad", reservaAmenidadRoutes);
app.use("/api/terapeutas", terapeutaRoutes);
app.use("/api/servicios-spa", servicioSpaRoutes);
app.use("/api/citas-spa", citaSpaRoutes);
app.use("/api/boletos-parque", boletoParqueRoutes);
app.use("/api/reservas-mesa", reservaMesaRoutes);
app.use("/api/carritos/:carritoId/items", carritoItemsRoutes);
app.use("/api/carritos", carritoRoutes);

// Debe ir después de todas las rutas
app.use(notFoundHandler);

// El manejador de errores siempre va al final
app.use(errorHandler);

export default app;
