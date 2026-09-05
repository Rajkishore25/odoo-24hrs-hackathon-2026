import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sendError } from "./utils/response.js";

const app: Express = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server root welcome / redirect to /api
app.get("/", (req: Request, res: Response) => {
  res.redirect("/api");
});

// Mount API routes under /api
app.use("/api", apiRouter);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  return sendError(res, "NOT_FOUND", `Endpoint ${req.method} ${req.originalUrl || req.path} not found`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
