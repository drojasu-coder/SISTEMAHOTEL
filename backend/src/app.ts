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

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "API de Hotel está funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/servicios-evento", servicioEventoRoutes);
app.use("/api/salones", salonRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/reservas-evento", reservaEventoRoutes);
app.use("/api/reservas-evento/:reservaId/servicios", reservaEventoServicioRoutes);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/turnos", turnoRoutes); 
app.use("/api/choferes", choferRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/reservas-transporte", reservaTransporteRoutes);
app.use("/api/sucursales", sucursalRoutes);

app.use("/api/mesas", mesaRoutes);
app.use("/api/recursos-actividad",recursoActividadRoutes);
app.use("/api/instructores",instructorRoutes);
app.use("/api/reservas-actividad",reservaActividadRoutes);
app.use("/api/amenidades",amenidadRoutes);
app.use("/api/reservas-amenidad",reservaAmenidadRoutes);
app.use("/api/terapeutas",terapeutaRoutes);
app.use("/api/servicios-spa",servicioSpaRoutes);
app.use("/api/citas-spa",citaSpaRoutes);
app.use("/api/boletos-parque",boletoParqueRoutes);
app.use("/api/reservas-mesa",reservaMesaRoutes);
app.use("/api/carritos/:carritoId/items", carritoItemsRoutes);
app.use("/api/carritos",carritoRoutes);

// Debe ir después de todas las rutas
app.use(notFoundHandler);

// El manejador de errores siempre va al final
app.use(errorHandler);

export default app;