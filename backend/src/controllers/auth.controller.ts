import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import logger from "../config/logger";

export class AuthController {
    
    constructor(private authService: AuthService) {}

    signup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            logger.info(`[controller] Signup request received for email: ${req.body.email}`);
            const result = await this.authService.signup(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.login(req.body);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch(error) {
            next(error);
        }
    };

    me = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.authService.getMe(req.user!.id);
            res.status(200).json({
                success: true,
                data: user
            });
        } catch(error) {
            next(error);
        }
    };

    logout = (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    };
}
