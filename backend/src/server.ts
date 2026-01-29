import logger from "./config/logger";
import dotenv from "dotenv";
dotenv.config();

import app  from "./app";
import { connectDB } from './config/db';

// connect to Redis
import "./config/redis";

// // Optional: background jobs
// import "./jobs/email.job";
// import "./jobs/whatsapp.job";
// import "./jobs/certificate.job";

async function bootstrap() {

    try{
        logger.info("Bootstrapping server...");


        // connect to Database
        await connectDB();

        // Start HTTP server
        app.listen(process.env.PORT, () => {
            logger.info(`Server is running on port ${process.env.PORT}`);
        });

        // Shutdown
        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);

    } catch(error) {
        logger.error("Failed to start server", error);
        process.exit(1);
    }
}

async function shutdown() {
    logger.warn("Shutting down gracefully...");
    process.exit(0);
}

bootstrap();