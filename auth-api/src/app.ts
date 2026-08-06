import compression from "compression";
import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authRateLimiter } from "./middlewares/rateLimiter.js";
import authRoutes from "./routes/auth.routes.js";

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan("combined"));

app.use("/api/auth", authRateLimiter);

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => res.status(200).send("OK"));

// must be last
app.use(errorHandler);

export default app;
