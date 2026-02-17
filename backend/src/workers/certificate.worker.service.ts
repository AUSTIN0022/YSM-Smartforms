import { ICertificateRepository } from "../repositories/certificate.repo";
import { CertificateGeneratorService } from "../services/certificate-generator.service";
import { FileService } from "../services/file.service";
import { FileContext } from "../types/file-context.enum";
import { resolveTemplate } from "../templates/template-registry";
import logger from "../config/logger";
import { fi } from "zod/v4/locales";

export class CertificateWorkerService {

    constructor(
        private certificateRepo: ICertificateRepository,
        private fileService: FileService,
        private generator: CertificateGeneratorService
    ) {}

    async generate(jobData: { certificateId: string }) {

        const certificate = await this.certificateRepo.findById(jobData.certificateId);

        if(certificate?.status === "GENERATED") {
            logger.info(`Certificate ${certificate.id} already generated, skipping.`);
            return;
        }
        
        if (!certificate) throw new Error("Certificate not found");

        try {
            await this.certificateRepo.updateStatus(certificate.id, "PROCESSING");

            const template = resolveTemplate(certificate.templateType);

            // Build data object from contact + event — no submission.answers needed
            const data = {
                name:             certificate.contact?.name   ?? "Participant",
                email:            certificate.contact?.email  ?? "",
                phone:            certificate.contact?.phone  ?? "",
                eventTitle:       certificate.event.title,
                description:      certificate.event.description ?? "",
                date:             new Date().toLocaleDateString("en-US", {
                                      year: "numeric", month: "long", day: "numeric"
                                  }),
            };

            const pdfBuffer = await this.generator.generate({ data, template });

            const filename = `${certificate.event.title}-${certificate.contact?.name ?? "participant" }.pdf`
                                .replace(/\s+/g, "_").toLowerCase();

            const uploaded = await this.fileService.upload({
                file: bufferToMulter(pdfBuffer, filename),
                context: FileContext.FORM_CERTIFICATE,
                eventId: certificate.eventId,
                ...(certificate.contactId && { contactId: certificate.contactId }),
            });

            logger.info(`Certificate ${certificate.id} generated and uploaded as file ${uploaded.id}`);
            await this.certificateRepo.updateStatus(certificate.id, "GENERATED", uploaded.id);

        } catch (error) {
            await this.certificateRepo.updateStatus(certificate.id, "FAILED");
            throw error;
        }
    }
}

function bufferToMulter(buffer: Buffer, filename: string): Express.Multer.File {
    return {
        fieldname: "file",
        originalname: filename,
        encoding: "7bit",
        mimetype: "application/pdf",
        buffer,
        size: buffer.length,
        stream: null as any,
        destination: "",
        filename: "",
        path: ""
    };
}