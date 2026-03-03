import { MessageStatus, MessageType } from "@prisma/client";
import { IMessageRepository } from "../repositories/message.repo";
import { IContactRepository } from "../repositories/contact.repo";
import { IEventRepository } from "../repositories/event.repo";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { messageQueue } from "../queues/message.queue";
import {
    MessageTemplate,
    CONTACT_ONLY_TEMPLATES,
    EVENT_REQUIRED_TEMPLATES,
} from "../types/message-template.enum";


type SendMessageInput = {
    contactId: string,
    eventId?: string,
    type: MessageType,
    template: string,
    params?: any,
}

const TEMPLATE_REQUIRED_FIELDS: Record<MessageTemplate, string[]> = {
    [MessageTemplate.OTP_VERIFICATION_CODE]: ["otp", "name"],
    [MessageTemplate.YSM_ONBOARDING_MESSAGE]: ["name"],
    [MessageTemplate.BIRTHDAY_WISHES_YSM]: ["name"],
    [MessageTemplate.FEEDBACK_COLLECTION_MESSAGE]: ["name", "eventName"],
    [MessageTemplate.THANK_YOU_FOR_ATTENDING_WORKSHOP]: ["name", "eventName"],
    [MessageTemplate.CERTIFICATE_ISSUED]: ["name", "eventName", "link"],
    [MessageTemplate.WORKSHOP_OR_INTERNSHIP_COMPLETION_MESSAGE]: ["name", "eventName", "link"],
    [MessageTemplate.INTERNSHIP_REGISTRATION_CONFIRMATION]: ["name", "eventName", "startDate", "mode", "reportingTime"],
    [MessageTemplate.REGISTRATION_SUCCESSFUL]: ["name", "eventName", "date", "time", "link"],
    [MessageTemplate.WORKSHOP_REMINDER_MESSAGE]: ["name", "eventName", "date", "time", "link"],
};

export class MessageService {

    constructor(
        private messageRepo: IMessageRepository,
        private contactRepo: IContactRepository,
        private eventRepo: IEventRepository
    ) { }

    async sendMessage(input: SendMessageInput) {

        const contact = await this.contactRepo.findById(input.contactId);
        if (!contact) {
            throw new NotFoundError("Contact not found");
        }

        if (!input.template) {
            throw new BadRequestError("Template is required");
        }

        const template = MessageTemplate[input.template as keyof typeof MessageTemplate];
        if (!template) {
            throw new BadRequestError("Invalid template");
        }

        // ── Event resolution ────────────────────────────────────────────────
        //
        // CONTACT_ONLY templates (OTP, onboarding, birthday) never need an event.
        // EVENT_REQUIRED templates need event context. If eventId wasn't passed in
        // (e.g. admin is on the Contacts tab), we try to auto-resolve it from
        // ContactEvent. If the contact is linked to exactly one event we use that.
        // If linked to multiple, we throw and ask the caller to be explicit.
        //
        let resolvedEventId = input.eventId;

        if (EVENT_REQUIRED_TEMPLATES.has(template) && !resolvedEventId) {
            const linkedEventIds = await this.contactRepo.findEventIdsByContactId(input.contactId);

            if (linkedEventIds.length === 0) {
                throw new BadRequestError(
                    `Template "${template}" requires event context, but this contact is not linked to any event.`
                );
            }

            if (linkedEventIds.length > 1) {
                throw new BadRequestError(
                    `Template "${template}" requires event context, but this contact is linked to ${linkedEventIds.length} events. ` +
                    `Please supply an explicit eventId. Linked events: [${linkedEventIds.join(", ")}]`
                );
            }

            // Exactly one event — safe to auto-resolve
            resolvedEventId = linkedEventIds[0];
        }

        if (CONTACT_ONLY_TEMPLATES.has(template) && resolvedEventId) {
            // Silently ignore any eventId passed for contact-only templates;
            // it's harmless but we don't want to store a misleading FK.
            resolvedEventId = undefined;
        }
        // ────────────────────────────────────────────────────────────────────

        // Resolve params from contact + event
        const event = resolvedEventId ? await this.eventRepo.findById(resolvedEventId) : null;

        const resolvedParams: any = {
            name: contact.name || "Participant",
            ...(event && {
                eventName: event.title,
                date: event.date ? new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                }) : "",
                time: event.date ? new Date(event.date).toLocaleTimeString("en-US", {
                    hour: "2-digit", minute: "2-digit"
                }) : "",
                link: event.link ?? `${process.env.DOMAIN}/event/${event.slug}`,
            })
        };

        const mergedParams: any = { ...resolvedParams, ...input.params };

        // Validate all required fields are present and non-empty
        const requiredFields = TEMPLATE_REQUIRED_FIELDS[template];
        if (requiredFields) {
            const missingOrEmptyFields = requiredFields.filter(field => {
                const value = mergedParams[field];
                return value === undefined || value === null || value === "";
            });

            if (missingOrEmptyFields.length > 0) {
                throw new BadRequestError(
                    `Missing or empty required parameters for template "${template}": ${missingOrEmptyFields.join(", ")}`
                );
            }
        }

        const log = await this.messageRepo.create({
            contactId: input.contactId,
            ...(resolvedEventId && { eventId: resolvedEventId }),
            type: input.type,
            template: input.template,
            params: mergedParams
        });

        await messageQueue.add(
            "send-message",
            { messageLogId: log.id },
            { jobId: log.id }
        );

        return log;
    }

    async updateStatus(
        id: string,
        status: MessageStatus,
        options?: { providerResponse?: any, errorMessage?: any }
    ) {
        const message = await this.messageRepo.findById(id);
        if (!message) {
            throw new NotFoundError("Message not found");
        }

        return this.messageRepo.updateStatus(id, status, options);
    }

    async incrementMesssageAttempt(id: string) {
        const message = await this.messageRepo.findById(id);
        if (!message) {
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
