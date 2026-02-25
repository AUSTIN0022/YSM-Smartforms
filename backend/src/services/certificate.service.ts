import { NotFoundError } from '../errors/http-errors';
import { certificateQueue } from '../queues/certificate.queue';
import { ISubmissionRepository } from '../repositories/submission.repo';
import { ICertificateRepository } from './../repositories/certificate.repo';
import { EventService } from './event.service';

type IssueResult = 
  | { submissionId: string; success: true; data: any }
  | { submissionId: string; success: false; error: Error };

export class CertificateService {
  constructor(
    private certificateRepo: ICertificateRepository,
    private submissionRepo: ISubmissionRepository,
    private eventService: EventService
  ) {}

  async issueCertificates(submissionIds: string[]): Promise<IssueResult[]> {
    
    const results: IssueResult[] = [];
    const batchSize = 50;

    for(let i = 0; i < submissionIds.length; i += batchSize) {
        
        const batch = submissionIds.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async (submissionId) => {
                try {
                    const data = await this.issueCertificate(submissionId);
                    return { submissionId, success: true as const, data };
                } catch (error) {
                    return { submissionId, success: false as const, error: error as Error };
                }
            })
        );

            results.push(...batchResults);
    }

    return  results;
  }

  private async issueCertificate(submissionId: string) {
    const submission = await this.submissionRepo.findSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    const existing = await this.certificateRepo.findBySubmissionId(submissionId);
    if (existing && existing.status === 'GENERATED') {
      return existing;
    }

    if (!existing) {
      const event = await this.eventService.findbyId(submission.eventId);
      if (!event) {
        throw new NotFoundError("Event not found");
      }

      const certificate = await this.certificateRepo.create({
        submissionId,
        ...(submission.contactId && { contactId: submission.contactId }),
        eventId: submission.eventId,
        status: 'QUEUED',
        templateType: event.templateType,
      });

      await certificateQueue.add(
            "generate-certificate", 
            { certificateId: certificate.id }, 
            { jobId: certificate.id },
        );
      return certificate;
    }

    // Existing but not GENERATED (FAILED/QUEUED) — re-queue
    await this.ensureJobExists(existing.id);
    return existing;
  }


  private async ensureJobExists(certificateId: string) { 
    const job = await certificateQueue.getJob(certificateId);

    if(!job) {
        await certificateQueue.add(
            "generate-certificate",
            { certificateId },
            { jobId: certificateId }
        );
        return;
    }

    const state = await job.getState();

    if(state === 'failed' ) {
        await job.remove();
        await certificateQueue.add(
            "generate-certificate",
            { certificateId },
            { jobId: certificateId }
        );
        return;
    }

  }

  async findById(certificateId: string) {
    
    const certificate = await this.certificateRepo.findById(certificateId);

    if(!certificate) {
        throw new NotFoundError("Certificate not found");
    }

    const data  = {
        valid:      certificate.status === "GENERATED",
        status:     certificate.status,
        issuedTo:   certificate.contact?.email ?? null,
        email:      certificate.contact?.email ?? null,
        event:      certificate.event.title,
        issuedAt:   certificate.issuedAt,
    } 

    return data; 
  }
}