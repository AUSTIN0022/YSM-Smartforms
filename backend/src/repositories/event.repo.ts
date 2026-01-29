import { Event, EventStatus, PaymentConfig } from "@prisma/client";
import { prisma } from "../config/db";

export type EventWithConfig = Event & {
    paymentConfig: PaymentConfig | null;
};

export interface IEventRepository {
    createEvent(data: any ): Promise<EventWithConfig>;
    update( id: string, data: any, config?: Partial<PaymentConfig>): Promise<EventWithConfig>;
    findBySlug(slug: string): Promise<EventWithConfig | null>;
    findById(id: string): Promise<EventWithConfig | null>;
    findByUser(userId: string): Promise<EventWithConfig[]>;
    publish(id: string): Promise<EventWithConfig>;
    close(id: string): Promise<EventWithConfig>;
    markAsDeleted(id: string): Promise<EventWithConfig>;
}

export class EventRepository implements IEventRepository {

    async createEvent(data: any ): Promise<EventWithConfig> {
        
        const { paymentConfig, ...eventData } = data;
        
        return prisma.event.create({
            data: {
                ...eventData,
                ...(paymentConfig && {
                    paymentConfig: { create: paymentConfig }
                })
            },
            include: { paymentConfig: true } 
        }) as Promise<EventWithConfig>;
    }

    async findBySlug(slug: string): Promise<EventWithConfig | null> {
        return prisma.event.findUnique({
            where: { slug },
            include: { paymentConfig: true }
        }) as Promise<EventWithConfig | null>;
    }

    async findById(id: string): Promise<EventWithConfig | null> {
        return prisma.event.findUnique({
            where: { id },
            include: { paymentConfig: true }
        }) as Promise<EventWithConfig | null>;
    }

    async findByUser(userId: string): Promise<EventWithConfig[]> {
        return prisma.event.findMany({
            where: { userId }, 
            include: { paymentConfig: true }
        }) as Promise<EventWithConfig[]>;
    }

    async update( id: string, data: any, config?: Partial<PaymentConfig> ) : Promise<EventWithConfig> {

        return prisma.event.update({
            where: { id },
            data: {
                ...data,
                paymentConfig: config ? {
                    upsert: {
                        create: { amount: config.amount || 0, currency: config.currency || "INR", description: config.description },
                        update: config
                    }
                } : undefined
                
            },
            include: { paymentConfig: true }
        }) as Promise<EventWithConfig>;
    }

    async publish(id: string): Promise<EventWithConfig> {
        return prisma.event.update({
            where: { id },
            data: { status: "ACTIVE" },
            include: { paymentConfig: true }
        }) as Promise<EventWithConfig>;
    }

    async close(id: string): Promise<EventWithConfig> {
        return prisma.event.update({
            where: { id },
            data: { status: "CLOSED" },
            include: { paymentConfig: true }
        }) as Promise<EventWithConfig>;
    }

    async markAsDeleted(id: string): Promise<EventWithConfig> {
        return prisma.event.update({
            where: { id },
            data: { isDeleted: true },
            include: { paymentConfig: true }
        })
    }
}