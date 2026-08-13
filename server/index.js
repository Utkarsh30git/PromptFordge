import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";



import connectDB from "./config/db.js";

dotenv.config();

const app = express();

connectDB();

// Standard security headers. crossOriginEmbedderPolicy is disabled
// and crossOriginOpenerPolicy relaxed to "same-origin-allow-popups" —
// Helmet's stricter defaults for both are known to break Google
// Identity Services' popup/postMessage login flow, which this app
// depends on. CSP is left off for now rather than shipping an
// under-tested policy that could silently break the Vite frontend or
// OpenAI calls — see the security audit notes for follow-up.
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
  })
);

// CLIENT_URL lets production point this at the real frontend origin;
// falling back to the existing local dev URL means nothing changes
// for anyone who doesn't set it.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "PromptForge API is running",
  });
});

// Anything under /api that didn't match a route above.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Final safety net. Every controller already has its own try/catch
// and returns a clean, hardcoded message on failure — this exists for
// whatever might still slip past that (a thrown error in middleware,
// a rejected promise Express 5 auto-forwards here, etc.), so a stack
// trace / internal detail can never reach the client by accident.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    message: "Something went wrong. Please try again.",
    ...(!isProd && err?.message ? { detail: err.message } : {}),
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});