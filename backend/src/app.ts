import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";

import { errorHandler } from "./middlewares/error.middleware";
import {notFoundHandler} from "./middlewares/notFound.middleware";

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: "1mb",
    })
);

app.get("/api/health", (_req, res)=>{
    res.status(200).json({
        succes: true,
        statusCode: 200,
        message: "API de Hotel está funcionando correctamente"
    });
});

app.use("/api/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;