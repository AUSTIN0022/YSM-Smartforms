import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { EventService } from "../services/event.service";
import { EventRepository } from "../repositories/event.repo";

import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createEventSchema, updateEventSchema } from "../validators/event.schema";

const router = Router();

const eventRepo = new EventRepository();
const eventService = new EventService(eventRepo);
const eventController = new EventController(eventService);

router.get("/slug/:slug", eventController.findBySlug);
router.post("/", authMiddleware, validate(createEventSchema), eventController.createEvent);
router.get("/", authMiddleware, eventController.findByUser);
router.put("/:id", authMiddleware, validate(updateEventSchema), eventController.updateEvent);
router.get("/:id", authMiddleware, eventController.findById);
router.put('/:id/publish', authMiddleware, eventController.publishEvent);
router.put('/:id/close', authMiddleware, eventController.closeEvent);
router.put('/:id/delete', authMiddleware, eventController.deleteEvent);

export default router; 