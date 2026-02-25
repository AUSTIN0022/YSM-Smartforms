import dotenv from "dotenv";
dotenv.config();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

import logger from "./config/logger";
import { startWorkers } from "./workers";


logger.info("Worker process started");

startWorkers();
