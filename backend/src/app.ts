import express from 'express';
import cors from "cors";
import morgan from "morgan";
import dotenv from 'dotenv';
import logger, { morganStream } from "./config/logger";
import routes from "./routes";
import path from "path";
import helmet from "helmet";
import addRequestId from "express-request-id";
import { paymentController } from "./container";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { serverAdapter } from './config/bull-board';
import { prisma } from './config/db';
import { redis } from './config/redis';

dotenv.config();
const app = express();

// security
app.use(helmet());

// req id
app.use(addRequestId({
    setHeader: true,
    headerName: 'X-Request-Id',
    attributeName: 'id'
}));

// Webhook
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentController.handleWebhook
);

// cors
const corsOptions =  {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}
app.use(cors(corsOptions));

// Logging
morgan.token('id', (req: any) => req.id);
app.use(morgan(
    ":id :method :url :status :res[content-length] - :response-time ms", 
    { stream: morganStream }
));

// body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
    "/storage",
    express.static(path.resolve(process.cwd(), "storage" ))
)

// Bull queue Dashboard
app.use('/admin/queues', serverAdapter.getRouter());

// Basic health check route
app.get('/health', async (req, res) => {

    const [db, cache] = await Promise.allSettled([
        prisma.$queryRaw`SELECT 1`,
        redis.ping()
        
    ]);

    const healthy = db.status === 'fulfilled' && cache.status === 'fulfilled';

    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'OK' : 'DEGRADED',
        db: db.status === 'fulfilled' ? 'OK' : 'ERROR',
        cache: cache.status === 'fulfilled' ? 'OK' : 'ERROR',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        requestId: req.id
    });
});

// All Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        requestId: req.id
    });
});



// Global error handler
app.use(globalErrorHandler);

export default app;