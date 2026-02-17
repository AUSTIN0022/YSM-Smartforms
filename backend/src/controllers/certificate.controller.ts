import { BadRequestError } from "../errors/http-errors";
import { CertificateService } from "../services/certificate.service";
import { NextFunction, Request, Response } from 'express';

export class CertificateController {
  constructor(private certificateService: CertificateService) {}

  issue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { submissionId, submissionIds } = req.body;

      if (!submissionId && (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0)) {
        throw new BadRequestError("submissionId or submissionIds[] is required to issue certificate(s)");
      }

      const ids: string[] = submissionId
        ? [submissionId]
        : [...new Set<string>(submissionIds)];

      const isBulk = !submissionId;
      const results = await this.certificateService.issueCertificates(ids);

      const summary = {
        total: results.length,
        queued: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      };

      // Single — preserve original flat response shape
      if (!isBulk) {
        const single = results[0];
        if (!single) {
          throw new BadRequestError("No result returned for submission");
        }
        if (!single.success) {
          throw single.error;
        }
        return res.status(202).json({
          message: "Certificate queued",
          data: single.data,
        });
      }

      // Bulk
      return res.status(202).json({
        message: "Bulk certificate generation queued",
        summary,
        results: results.map(r => ({
          submissionId: r.submissionId,
          success: r.success,
          ...(r.success ? { data: r.data } : { error: r.error.message }),
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}