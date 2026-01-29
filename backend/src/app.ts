import express from 'express';
import cors from "cors";
import morgan from "morgan";
import dotenv from 'dotenv';
import logger, { morganStream } from "./config/logger";
import routes from "./routes";
import path from "path";

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(morgan("combined", { stream: morganStream }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
    "/storage",
    express.static(path.resolve(process.cwd(), "storage" ))
)

// Basic health check route
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// All Routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

export default app;