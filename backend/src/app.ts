import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";

import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import servicioEventoRoutes from "./routes/eventos/servicioEvento.routes";
import HabitacionRoutes from "./routes/habitaciones/habitacion.routes";


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
app.use("/api/habitaciones", HabitacionRoutes);


// Debe ir después de todas las rutas
app.use(notFoundHandler);

// El manejador de errores siempre va al final
app.use(errorHandler);

export default app;