import {
    FormSubmission,
    SubmissionAnswer,
    Visitor,
    VisitSession,
    Contact,
    SubmissionStatus,
} from "@prisma/client";
import { prisma } from "../config/db";

export type SubmissionWithAnswers = FormSubmission & {
    answers: SubmissionAnswer[];
    contact: Contact | null
};


export interface ISubmissionRepository {
    
    // visitor & session
    upsertVisitor(data: {
        uuid: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<Visitor>;

    createVisitSession(data: {
        visitorId: string;
        eventId: string;
        status: SubmissionStatus;
    }): Promise<VisitSession>;

    updateSessionStatus(
        id: string,
        status: SubmissionStatus
    ): Promise<VisitSession>;

    // Contact

    findContactByEmailOrPhone(
        email?: string,
        phone?: string
    ): Promise<Contact | null>;

    createContact(data: {
        name?: string;
        email?: string;
        phone?: string;
    }): Promise<Contact>;
    
    updateContact(data: {
        id:string
        name?: string;
        email?: string;
        phone?: string;
    }): Promise<Contact>;

    createFullSubmission(data: {
        formId: string;
        eventId: string;
        visitorId: string;
        contactId?: string;
        status: SubmissionStatus;
        answers: {
            fieldId: string;
            fieldKey: string;
            valueText?: string;
            valueNumber?: number;
            valueBoolean?: boolean;
            valueDate?: Date;
            valueJson?: any;
            fileUrl?: string;
        }[];
    }): Promise<SubmissionWithAnswers>;

    // Admin Reads

    findSubmissionById( id: string ): Promise<SubmissionWithAnswers | null>;
    findSubmissionsByEvent(
        eventId: string,
        options?: {
            status?: SubmissionStatus;
            limit?: number;
            offset?: number;
            formDate?: Date;
            toDate?: Date; 
        }
    ): Promise<SubmissionWithAnswers[]>;

    attachFilesToContact(params: {
        fileIds: string[];
        contactId: string;
    }): Promise<void>;

}

export class SubmissionsRepositories implements ISubmissionRepository {

    // visitor & session
    async upsertVisitor(data: { uuid: string; ipAddress?: string; userAgent?: string; }): Promise<Visitor> {
        
        return prisma.visitor.upsert({
            where: { uuid: data.uuid},
            create: {
                uuid: data.uuid,
                ipAddress: data.ipAddress ?? null,
                userAgent: data.userAgent ?? null
            },
            update: {
                ipAddress: data.ipAddress ?? null,
                userAgent: data.userAgent ?? null,
                lastSeenAt: new Date()
            }
        });
    }

    async createVisitSession(data: { visitorId: string; eventId: string; status: SubmissionStatus }): Promise<VisitSession> {
        const existing = await prisma.visitSession.findUnique({
            where: {
                visitorId_eventId: {
                    visitorId: data.visitorId,
                    eventId: data.eventId,
                },
            },
        });

        // No session → create
        if (!existing) {
            return prisma.visitSession.create({ data });
        }

        // Enforce monotonic progression
        const order: Record<SubmissionStatus, number> = {
            VISITED: 1,
            STARTED: 2,
            SUBMITTED: 3,
        };

        if (order[data.status] <= order[existing.status]) {
            return existing;
        }

        // Upgrade only
        return prisma.visitSession.update({
            where: { id: existing.id },
            data: { status: data.status },
        });
    }
    


    async updateSessionStatus(id: string, status: SubmissionStatus): Promise<VisitSession> {
        return prisma.visitSession.update({
            where: { id: id},
            data:{
                status: status
            }
        });
    }

    // Contact
    async findContactByEmailOrPhone(email?: string, phone?: string): Promise<Contact | null> {
        if( !email && !phone) return null;
        
        return prisma.contact.findFirst({
            where: {
                OR: [
                    ...(email ? [{ email }]: [] ),
                    ...(phone ? [{ phone }]: [] )
                ]
            }
        });
    }

    async createContact(data: { name?: string; email?: string; phone?: string; }): Promise<Contact> {
        return prisma.contact.create({
            data
        });
    }

    async updateContact(data: {id:string, name?: string; email?: string; phone?: string; }): Promise<Contact> {
        return prisma.contact.update({
            where: { id: data.id },
            data: {
                name: data.name ?? null,
                email: data.email ?? null,
                phone: data.phone ?? null
            }
        });
    }

    async createFullSubmission(data: { formId: string; eventId: string; visitorId: string; contactId?: string; status: SubmissionStatus; answers: { fieldId: string; fieldKey: string; valueText?: string; valueNumber?: number; valueBoolean?: boolean; valueDate?: Date; valueJson?: any; fileUrl?: string; }[]; }): Promise<SubmissionWithAnswers> {
        
        return prisma.$transaction(async (tx) => {

            const submission = await tx.formSubmission.create({
                data: {
                    formId: data.formId,
                    eventId: data.eventId,
                    visitorId: data.visitorId,
                    contactId: data.contactId ?? null,
                    status: data.status,
                },
            });

            await tx.submissionAnswer.createMany({
                data: data.answers.map((a) => ({
                    submissionId: submission.id,
                    fieldId: a.fieldId,
                    fieldKey: a.fieldKey,
                    valueText: a.valueText ?? null,
                    valueNumber: a.valueNumber ?? null,
                    valueBoolean: a.valueBoolean ?? null,
                    valueDate: a.valueDate ?? null,
                    valueJson: a.valueJson ?? null,
                    fileUrl: a.fileUrl ?? null,
                })),
            });

            await tx.visitSession.updateMany({
                where: {
                    visitorId: data.visitorId,
                    eventId: data.eventId,
                },
                data: { status: "SUBMITTED" }
            })

            const fullSubmission = await tx.formSubmission.findUnique({
                where: { id: submission.id },
                include: { answers: true },
            });

            return fullSubmission as SubmissionWithAnswers;

        })
    }    


    // admin reads

    async findSubmissionById(id: string): Promise<SubmissionWithAnswers | null> {
        return prisma.formSubmission.findFirst({
            where: { id: id},
            include: { 
                answers: { orderBy: { fieldKey: "asc"} },
                contact: true,
             }
        })
    };

    async findSubmissionsByEvent(eventId: string, options?: { status?: SubmissionStatus; limit?: number; offset?: number; formDate?: Date; toDate?: Date; }): Promise<SubmissionWithAnswers[]> {
        return prisma.formSubmission.findMany({
            where: { 
                eventId,
                isDeleted: false,
                ...(options?.status && { status: options.status }),
                ...(options?.formDate || options?.toDate
                    ? {
                        submittedAt: {
                            ...(options.formDate && { gte: options.formDate }),
                            ...(options.toDate && { lte: options.toDate}),
                        }
                    }: {}
                 ),
            },
            ...(options?.limit && { take: options.limit }),
            ...(options?.offset && { skip: options.offset }),
            
            include: {
                answers: {
                    orderBy: { fieldKey: "asc" }
                },
                contact: true,
            }
        })
    }

    async attachFilesToContact(params: {
        fileIds: string[];
        contactId: string;
    }) {
        await prisma.fileAsset.updateMany({
            where: {
                id: { in: params.fileIds },
                contactId: null,
            },
            data: { contactId: params.contactId },
        });
    }

}