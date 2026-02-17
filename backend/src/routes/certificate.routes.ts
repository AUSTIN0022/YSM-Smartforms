import { Router  } from "express";
import { CertificateController } from "../controllers/certificate.controller";
import { CertificateService } from "../services/certificate.service";
import { CertificateRepository } from "../repositories/certificate.repo";
import { SubmissionsRepositories } from "../repositories/submission.repo";
import { authMiddleware } from "../middlewares/auth.middleware";
import { EventService } from "../services/event.service";
import { EventRepository } from "../repositories/event.repo";


const router  = Router();

const eventRepo = new EventRepository();
const eventService = new EventService(eventRepo)
const submissionRepo = new SubmissionsRepositories();
const certificateRepo = new CertificateRepository();
const certificateService = new CertificateService(certificateRepo, submissionRepo, eventService);
const controller = new CertificateController(certificateService);


// POST /api/certificates/generate  [single or many i.e accept submissionId or ids in body and not params]
router.post(
    '/generate',
    authMiddleware,
    controller.issue
);


export default router;