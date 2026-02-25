import { MessageLog, MessageStatus, MessageType } from "@prisma/client";
import { prisma } from "../config/db";

export type MessageLogWithRelations = MessageLog & {
    contact:{
        id: string;
        name: string  | null;
        email: string | null;
        phone: string | null;
    } | null;
    event?: {
        id: string;
        title: string;
    } | null;
}


export interface IMessageRepository {

    create(data: {
        contactId: string;
        eventId?: string;
        type: MessageType;
        template: string;
    }): Promise  <MessageLog>;

    updateStatus(
        id: string,
        status: MessageStatus,
        options?: { providerResponse?: any; errorMessage?: string; }
    ): Promise<MessageLog>;

    incrementAttempt(id: string): Promise<void>;

    findById(id: string): Promise<MessageLogWithRelations | null>;

    findByContactId(
        contactId: string,
        options?: { limit?: number; offset?: number; }
    ): Promise<MessageLogWithRelations[]>

    findByEmail(
        email: string,
        options?: { limit?: number; offset?: number; }
    ): Promise<MessageLogWithRelations[]>

    findByPhone(
        phone: string,
        options?: { limit?: number; offset?: number; }
    ): Promise<MessageLogWithRelations[]>

}


export class MessageRepository implements IMessageRepository {

    async create(data: { 
        contactId: string; 
        eventId?: string; 
        type: MessageType; 
        template: string; 
    }): Promise<MessageLog> {
        
        return prisma.messageLog.create({
            data: {
                ...data,
                status: 'QUEUED'
            }
        });
    }

    async updateStatus(
        id: string, 
        status: MessageStatus, 
        options?: { 
            providerResponse?: any; 
            errorMessage?: string; 
        }): Promise<MessageLog> {
            
        return prisma.messageLog.update({
            where: { id },
            data: {
                status,
                ...(status === 'SENT' && { sentAt: new Date() }),
                ...(options?.providerResponse && { providerResponse: options.providerResponse }),
                ...(options?.errorMessage && { errorMessage: options.errorMessage }),
            }
        });
    }

    async incrementAttempt(id: string): Promise<void> {
        await prisma.messageLog.update({
            where: { id },
            data: {
                attempts: { increment: 1 }
            }
        })
    }


    async findById(id: string): Promise<MessageLogWithRelations | null> {
        return prisma.messageLog.findUnique({
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
                    }
                }
            }
        })
    }

    async findByContactId(contactId: string, options?: { limit?: number; offset?: number; }): Promise<MessageLogWithRelations[]> {
        return prisma.messageLog.findMany({
            where: {
                contactId,
                isDeleted: false
            },
            include: {
                contact: true,
                event: true,
            },
            orderBy: { createdAt: "desc"},
            take: options?.limit ?? 20,
            skip: options?.offset ?? 0
        });
    }

    async findByEmail(email: string, options?: { limit?: number; offset?: number; }): Promise<MessageLogWithRelations[]> {
        return prisma.messageLog.findMany({
            where: {
                contact: {
                    email: email
                },
                isDeleted: false
            },
            include: {
                contact: true,
                event: true,
            },
            orderBy: { createdAt: "desc"},
            take: options?.limit ?? 20,
            skip: options?.offset ?? 0
        });
    }

    async findByPhone(phone: string, options?: { limit?: number; offset?: number; }): Promise<MessageLogWithRelations[]> {
        return prisma.messageLog.findMany({
            where: {
                contact: {
                    phone: phone
                },
                isDeleted: false
            },
            include: {
                contact: true,
                event: true,
            },
            orderBy: { createdAt: "desc"},
            take: options?.limit ?? 20,
            skip: options?.offset ?? 0
        });
    }

}