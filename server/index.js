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


app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
  })
);


const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const allowedOrigins = [
  "http://localhost:5173",
   CLIENT_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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


app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});


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