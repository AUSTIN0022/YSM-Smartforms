// mappers/event.mapper.ts
import { EventResponseDTO } from "../dtos/event/event-response.dto";
import { EventWithConfig } from "../repositories/event.repo";

export const toEventResponseDTO = (event: EventWithConfig): EventResponseDTO => {
    const dto: EventResponseDTO = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        status: event.status,
        paymentEnabled: event.paymentEnabled,
    };

    if (event.paymentConfig) {
        dto.paymentConfig = {
            amount: event.paymentConfig.amount,
            currency: event.paymentConfig.currency,
            description: event.paymentConfig.description,
        };
    }

    return dto;
};