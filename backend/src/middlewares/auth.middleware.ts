import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UserRepository } from "../repositories/user.repo";
import logger from "../config/logger";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
        logger.debug("Attempting to authenticate user");
        const userRepository = new UserRepository();
        
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("Unauthorized");
        }

        const token = authHeader.split(" ")[1];
        if(!token) {
            throw new Error("Unauthorized");
        }
        console.time("Token verification time");
        const payload = verifyToken(token);
        console.timeEnd("Token verification time");
        
        const user = await userRepository.findById(payload.userId);

        if (!user) {
            throw new Error("Unauthorized");
        }

        req.user = user;
        logger.debug(`User authenticated: ${user.id}`);
        next();
    } catch(error) {
        next(error);
    }
};
