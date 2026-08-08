import "dotenv/config";

import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";

import { env, isAiEnabled } from "./env.js";
import { cardRouter } from "./routes/card.js";
import { cachedCount } from "./services/cardCache.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: isAiEnabled ? "ai" : "mock",
    model: isAiEnabled ? env.OPENROUTER_MODEL : null,
  });
});

app.use("/api/cards", cardRouter);

const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
};
app.use(notFound);

// Express 5 forwards async rejections here automatically, so route handlers
// need no wrapper. Must be registered last.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`\n  ⚡ Zero-Aura API on http://localhost:${env.PORT}`);
  console.log(
    isAiEnabled
      ? `  mode: AI (${env.OPENROUTER_MODEL} via OpenRouter)`
      : "  mode: MOCK — set OPENROUTER_API_KEY in backend/.env to enable live cards",
  );
  console.log(`  cors: ${env.CORS_ORIGIN}`);

  void cachedCount().then((count) => {
    console.log(
      `  cache: ${count} card(s) — add ?refresh=true to /api/cards/feed to regenerate\n`,
    );
  });
});
