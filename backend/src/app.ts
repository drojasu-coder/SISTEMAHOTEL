import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";

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

// Debe ir después de todas las rutas
app.use(notFoundHandler);

// El manejador de errores siempre va al final
app.use(errorHandler);

export default app;