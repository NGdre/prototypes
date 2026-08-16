import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authRateLimiter } from "./middlewares/rateLimiter.js";
import authRoutes from "./routes/auth.routes.js";
import { env } from "./config/env.js";

const app: Express = express();

app.set("trust proxy", env.TRUST_PROXY);

app.use(helmet());
// credentials: true is required so the browser stores/sends the httpOnly
// refresh cookie on cross-origin requests to this API.
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(morgan("combined"));

app.use("/api/auth", authRateLimiter);

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => res.status(200).send("OK"));

// must be last
app.use(errorHandler);

export default app;
