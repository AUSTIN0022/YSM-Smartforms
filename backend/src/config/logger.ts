import winston from "winston";
// import { env } from "../.env";
import { StreamOptions } from "morgan";

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// custom log format
const logFormat = printf(( { level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
})



// Logger Instance

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info": "debug",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        process.env.NODE_ENV === "production" ? json() : logFormat
    ),
    transports: [
        new winston.transports.Console({
            format:
                process.env.NODE_ENV === "production"
                    ? json()
                    : combine(colorize(), logFormat),
        }),
    ],
    exitOnError: false,
});


export const morganStream: StreamOptions = {
    write: (message: string) => {
        logger.http(message.trim());
    }
};

export default logger;