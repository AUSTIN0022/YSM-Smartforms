import { IEventRepository } from "../repositories/event.repo";
import { EventInput, EventUpdate } from "../validators/event.schema";

import { createSlug, generateRandomString } from '../utils/slug'

// dtos
import { EventResponseDTO } from "../dtos/event/event-response.dto";

// mapper
import { toEventResponseDTO } from "../mappers/event.mapper";

// error handler
import { ConflictError, UnauthorizedError, NotFoundError } from "../errors/http-errors";


export class EventService {

    constructor(private eventRepositor: IEventRepository) {}

    async createEvent(data: EventInput, userId: string): Promise<EventResponseDTO> {
        let slug = createSlug(data.title);
        const isExisting = await this.eventRepositor.findBySlug(slug);
        if (isExisting) {
            slug = `${slug}-${generateRandomString(4)}`;
        }

        const event = await this.eventRepositor.createEvent({
            userId,
            title: data.title,
            slug,
            description: data.description ?? undefined,
            status: data.status,
            paymentEnabled: data.paymentEnabled,
            paymentConfig: data.paymentConfig ? {
                amount: data.paymentConfig.amount,
                currency: data.paymentConfig.currency,
                description: data.paymentConfig.description ?? undefined
            } : undefined
        });

        return toEventResponseDTO(event);
    }

    async updateEvent(id: string, userId: string, data: EventUpdate): Promise<EventResponseDTO> {
        const event = await this.eventRepositor.findById(id);
        if (!event) throw new NotFoundError(`No Event found`);
        if (event.userId !== userId) throw new UnauthorizedError("Unauthorized access");

        
        const updatedEvent = await this.eventRepositor.update(id, {
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            status: data.status ?? undefined,
            paymentEnabled: data.paymentEnabled ?? undefined,
            paymentConfig: data.paymentConfig ? {
                amount: data.paymentConfig.amount ?? undefined,
                currency: data.paymentConfig.currency ?? undefined,
                description: data.paymentConfig.description ?? undefined
            } : undefined
        });

        return toEventResponseDTO(updatedEvent);
    }

    async findbySlug(slug: string): Promise<EventResponseDTO | null > {
        
        const event = await this.eventRepositor.findBySlug(slug);
        if(!event) {
            throw new NotFoundError(`No Event found by ${slug}`)
        }

        return toEventResponseDTO(event); 
    }

    async findbyId(id: string): Promise<EventResponseDTO | null > {
        
        const event = await this.eventRepositor.findById(id);
        if(!event) {
            throw new NotFoundError(`No Event found by ${id}`)
        }

        return toEventResponseDTO(event); 
    }

    async findByUser(userId: string): Promise<EventResponseDTO[]> {
        const events = await this.eventRepositor.findByUser(userId);
        
        if (!events) return [];

        return events?.map(event => toEventResponseDTO(event));
    }


    async publishEvent(id: string, userId: string): Promise<EventResponseDTO> {
        const event = await this.eventRepositor.findById(id);
        if (!event) throw new NotFoundError(`No Event found`);

        if (event.userId !== userId) throw new UnauthorizedError("Unauthorized access");
        
        const updatedEvent = await this.eventRepositor.publish(id);

        return toEventResponseDTO(updatedEvent); 
    }

    async closeEvent(id: string, userId:string): Promise<EventResponseDTO> {
        const event = await this.eventRepositor.findById(id);
        if (!event) throw new NotFoundError(`No Event found`);
        
        if (event.userId !== userId) throw new UnauthorizedError("Unauthorized access");

        const Updatedevent = await this.eventRepositor.close(id);

        return toEventResponseDTO(Updatedevent); 
    }

    async deleteEvent(id: string, userId:string): Promise<EventResponseDTO> {
        try {
            const event = await this.eventRepositor.findById(id);
            if (!event) throw new NotFoundError(`No Event found`);
        
            if (event.userId !== userId) throw new UnauthorizedError("Unauthorized access");

            const Deletedevent = await this.eventRepositor.markAsDeleted(id);

            return toEventResponseDTO(Deletedevent);
        } catch (error) {
            throw error;
        }
    }
}