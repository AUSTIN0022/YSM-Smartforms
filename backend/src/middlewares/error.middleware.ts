import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";
import logger from "../config/logger";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
