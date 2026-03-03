import { Router  } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { certificateController } from "../container";


const router  = Router();

// POST /api/certificates/generate  [single or many i.e accept submissionId or ids in body and not params]
router.post(
    '/generate',
    authMiddleware,
    certificateController.issue
);

// GET /api/certificates/verify?certificateId=xxx
router.get("/verify", certificateController.verify);

export default router;