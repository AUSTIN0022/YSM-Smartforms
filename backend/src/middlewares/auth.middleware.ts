import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import logger from "../config/logger";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new Error("Unauthorized");
    }

    // JWT signature verification is sufficient for identity —
    // the token is cryptographically signed and has a 30-minute TTL.
    // No DB round trip needed on every request.
    const payload = verifyToken(token);

    req.user = { id: payload.userId };

    logger.debug(`User authenticated: ${payload.userId}`);
    next();
  } catch (error) {
    next(error);
  }
};
