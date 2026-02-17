import logger from "./config/logger";
import { startWorkers } from "./workers";

logger.info("Worker process started");

startWorkers();
