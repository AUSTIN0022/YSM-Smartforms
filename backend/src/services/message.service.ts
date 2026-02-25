import { MessageType } from "@prisma/client";
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

    async getMessageByContact(contactId: string) {
        const contact = await this.contactRepo.findById(contactId);
        if(!contact) {
            throw new NotFoundError("Contact not found");
        }

        return this.messageRepo.findByContactId(contactId);
    }

    async getMessageByEmail(email: string) {
        if(!email) {
            throw new BadRequestError("Email required");
        }

        return this.messageRepo.findByEmail(email);
    }

    async getMessageByPhone(phone: string) {
        if(!phone) {
            throw new BadRequestError("Phone no required");
        }

        return this.messageRepo.findByPhone(phone);
    }

}