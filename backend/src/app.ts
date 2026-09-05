import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sendError } from "./utils/response.js";

const app: Express = express();

// Current directory in CommonJS / Node runtime
const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

// Candidate paths for built frontend dist
const candidatePaths = [
  process.env.FRONTEND_DIST_PATH,
  path.resolve(currentDir, "../../frontend/dist"),
  path.resolve(process.cwd(), "frontend/dist"),
  path.resolve(process.cwd(), "../frontend/dist"),
  path.resolve(currentDir, "../../../frontend/dist"),
].filter(Boolean) as string[];

const frontendDist = candidatePaths.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, "index.html")));

// Security and utility middlewares (relaxed CSP for client SPA scripts & fonts)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes under /api
app.use("/api", apiRouter);

// API 404 Handler for any unmatched /api routes
app.all("/api/*", (req: Request, res: Response) => {
  return sendError(res, "NOT_FOUND", `Endpoint ${req.method} ${req.originalUrl || req.path} not found`, 404);
});

// Serve frontend static build if present
if (frontendDist) {
  app.use(express.static(frontendDist));

  // SPA Fallback for client-side routing
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  // Server root welcome / redirect to /api when frontend is not built
  app.get("/", (req: Request, res: Response) => {
    res.redirect("/api");
  });

  // Default 404 Handler
  app.use((req: Request, res: Response) => {
    return sendError(res, "NOT_FOUND", `Endpoint ${req.method} ${req.originalUrl || req.path} not found`, 404);
  });
}

// Centralized Error Handler
app.use(errorHandler);

export default app;

