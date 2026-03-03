import { Router } from "express";
import { SubmissionController } from "../controllers/submission.controller";
import { SubmissionService } from "../services/submissions.service";
import { SubmissionsRepositories } from "../repositories/submission.repo";
import { FormRepositories } from "../repositories/form.repo";
import { EventRepository } from "../repositories/event.repo";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { startSubmission, submissionFilter, submissionForm, } from "../validators/submission.schema";
import { visitorSchema } from './../validators/visitor.schema';

import rateLimit from "express-rate-limit";
import RedisStore from 'rate-limit-redis';

const router = Router();

// --- Dependency Injection ---
const submissionRepo = new SubmissionsRepositories();
const formRepo = new FormRepositories();
const eventRepo = new EventRepository();

const submissionService = new SubmissionService(
  submissionRepo,
  formRepo,
  eventRepo
);

const submissionController = new SubmissionController(submissionService);


// Rate limiter
const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, 
    message: "Too many submissions from this IP, please try again later."
    
});


// PUBLIC ROUTES (User / Visitor)

// Get public form
router.get(
  "/:slug",
  submissionController.getPublicForm
);

// Record visit
router.post(
  "/:slug/visit",
  submissionController.recordVisit
);

// Start submission
router.post(
  "/:slug/start",
  validate(startSubmission),
  submissionController.startSubmission
);

// Submit form
router.post(
  "/:slug/submit",
  submitLimiter,
  validate(submissionForm),
  submissionController.submitForm
);

// Save draft
router.post(
  "/:slug/draft",
  submissionController.saveDraft
);

// Get draft
router.get(
  "/:slug/draft",
  submissionController.getDraft
);

// ADMIN ROUTES (Authenticated)

// Get submission by ID
router.get(
  "/admin/submissions/:id",
  authMiddleware,
  submissionController.getSubmissionById
);

// Get submissions by event
router.get(
  "/admin/events/:id/submissions",
  authMiddleware,
  validate(submissionFilter),
  submissionController.getSubmissionByEvent
);

export default router;
