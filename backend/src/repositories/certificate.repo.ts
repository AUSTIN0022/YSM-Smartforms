import { Certificate, CertificateStatus, CertificateTemplateType } from "@prisma/client";
import { prisma } from "../config/db";

export type CertificateWithRelations = Certificate & {
    contact: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
    } | null;
    event: {
        id: string;
        title: string;
        description: string | null;
    };
}


export interface ICertificateRepository {

    create(data: {
        submissionId: string;
        contactId?: string;
        eventId: string;
        status: CertificateStatus;
        fileAssetId?: string;
        templateType: CertificateTemplateType;
    }): Promise<Certificate>;


    findById(id: string): Promise<CertificateWithRelations | null>;

    findBySubmissionId(submissionId: string): Promise<Certificate | null>;

    updateStatus(
        id: string,
        status: CertificateStatus,
        fileAssetId?: string
    ): Promise<Certificate>;
}

export class CertificateRepository implements ICertificateRepository {

    async create(data: { 
        submissionId: string; 
        contactId?: string; 
        eventId: string; 
        status: CertificateStatus;
        fileAssetId?: string;
        templateType: CertificateTemplateType;
    }): Promise<Certificate> {
        return await prisma.certificate.create({ data });
    }


    async findById(id: string): Promise<CertificateWithRelations | null> {
         return await prisma.certificate.findUnique({
            where: { id },
            include: {
                contact: {
                    select: {
                        id: true, 
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                    }
                }
            }
         });
    }

    async findBySubmissionId(submissionId: string): Promise<Certificate | null> {
        return await prisma.certificate.findUnique({
            where: { submissionId }
        });
    }   

    async updateStatus(id: string, status: CertificateStatus, fileAssetId?: string): Promise<Certificate> {
        return await prisma.certificate.update({
            where: { id },
           data: {
            status,
            ...(fileAssetId && { fileAssetId }),
            ...(status === "GENERATED" && { issuedAt: new Date() })
           }
        })
    }
}