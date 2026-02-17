import { NextFunction, Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { BadRequestError } from "../errors/http-errors";


export class AnalyticsController { 

    constructor(private analyticsService: AnalyticsService) {}


    getGlobalStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.analyticsService.getGlobalStats();

            res.status(200).json({
                success: true,
                data: result
            });
            
        } catch(error) {
            next(error);
        }
    }

    getEventAnalytics = async (req: Request, res: Response, next: NextFunction) => {
        try {   
            const eventId = req.params.eventId as string;

            if(!eventId) throw new BadRequestError("Event ID is needed for analytics");

            const result = await this.analyticsService.getEventAnalytics(eventId);

            res.status(200).json({
                success: true,
                data: result,
            });

        } catch(error) {
            next(error);
        }
    }
}