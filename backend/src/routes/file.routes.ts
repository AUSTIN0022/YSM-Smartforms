import { Router } from "express";
import { FileRepository } from "../repositories/file.repo";
import { getStorageProvider } from "../providers/storage.provider";
import { FileService } from "../services/file.service";
import { FileController } from "../controllers/file.controller";
import { multerMemoryUpload } from "../middlewares/multer.middleware";
import { validateFile } from "../middlewares/file-validate.middleware";
import { compressImage } from "../middlewares/image-compress.middleware";


const router = Router();


// DI
const fileRepo = new FileRepository();
const storage = getStorageProvider();
const fileService = new FileService(fileRepo, storage);
const controller = new FileController(fileService);


// POST /api/files/upload

router.post(
    "/upload",
    multerMemoryUpload.single("file"),
    validateFile({ category: "any", maxSizeMB: 10 }),
    compressImage(false),   // later if needed
    controller.upload
);


// get by file ID
router.get("/:id", controller.getById);

// get files by contact
router.get("/contact/:contactId", controller.getByContactId);

// get files by event
router.get("/event/:eventId", controller.getByEventId);

// delete file
router.delete("/:id", controller.deleteById);

export default router;