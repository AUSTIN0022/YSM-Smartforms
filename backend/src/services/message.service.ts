import { MessageStatus, MessageType } from "@prisma/client";
import { IMessageRepository } from "../repositories/message.repo";
import { IContactRepository } from "../repositories/contact.repo";
import { BadRequestError, NotFoundError } from "../errors/http-errors";

type SendMessageInput = {
    contactId: string,
    eventId?: string,
    type: MessageType,
    template: string,
}

export class MessageService {

    constructor(
        private messageRepo: IMessageRepository,
        private contactRepo: IContactRepository
    ) {}

    async sendMessage(input: SendMessageInput) {

        const contact = await this.contactRepo.findById(input.contactId);
        if (!contact) {
            throw new NotFoundError("Contact not found");
        }
        if(!input.template) {
            throw new BadRequestError("Template is required");
        }

        const log = await this.messageRepo.create({
            contactId: input.contactId,
            ...(input.eventId && { eventId: input.eventId }),
            type: input.type,
            template: input.template
        });

        // TODO: later enqueue job here
        return log;
    }

    async updateStatus(
        id: string,
        status: MessageStatus,
        options?: { providerResponse?: any, errorMessage?: any }
    ) {
        const message = await this.messageRepo.findById(id);
        if(!message) {
            throw new NotFoundError("Message not found");
        }

        return this.messageRepo.updateStatus(id, status, options);
    }

    async incrementMesssageAttempt(id: string) {
        
        const message = await this.messageRepo.findById(id);
        if(!message) {
            throw new NotFoundError("Message not found");
        }

        await this.messageRepo.incrementAttempt(id);
    }

    async getMessages(
            contactId?: string,
            eventId?: string,
            email?: string,
            phone?: string,
        ) {
            return this.messageRepo.getMessages(
                contactId, 
                eventId, 
                email,
                phone
            );
    }
}