import express, { Express, Request, Response, NextFunction } from "express";
import type { Router } from "express";

export type RouteMount = [basePath: string, router: Router];

interface BuildAppOptions {
  /** Mirror the payment webhook's raw-body parser from src/index.ts. */
  rawWebhook?: boolean;
}

/**
 * Build an Express app that mounts the real routers, so tests exercise the
 * actual controllers, middleware and validation rather than re-implementing
 * their logic.
 */
export function buildApp(mounts: RouteMount[], options: BuildAppOptions = {}): Express {
  const app = express();

  // Must come before express.json(), exactly like the production server.
  if (options.rawWebhook) {
    app.use("/api/payments/webhook/paystack", express.raw({ type: "*/*", limit: "1mb" }));
  }

  app.use(express.json({ limit: "10mb" }));

  for (const [basePath, router] of mounts) {
    app.use(basePath, router);
  }

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: "Not found" });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, message: err?.message ?? "Internal error" });
  });

  return app;
}
