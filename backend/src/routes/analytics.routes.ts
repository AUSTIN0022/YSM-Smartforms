import { Router } from 'express';
import { AnalyticsRepository } from '../repositories/analytics.repo';
import { AnalyticsService } from '../services/analytics.service';
import { EventRepository } from '../repositories/event.repo';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';


const router = Router();

// DI
const analyticsRepo = new AnalyticsRepository();
const eventRepo = new EventRepository();
const analyticsService = new AnalyticsService(analyticsRepo, eventRepo);
const analyticsController = new AnalyticsController(analyticsService);

router.get("/events/:eventId", authMiddleware, analyticsController.getEventAnalytics);
router.get("/global",  authMiddleware, analyticsController.getGlobalStats);


export default router;