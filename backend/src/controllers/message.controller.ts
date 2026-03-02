import { Request, Response, NextFunction } from "express";
import { MessageService } from "../services/message.service";
import { BadRequestError } from "../errors/http-errors";

export class MessageController {

    constructor(private messageService: MessageService) { }

    send = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { contactId, eventId, type, template } = req.body;

            if (!contactId || !type || !template) {
                throw new BadRequestError("contactId, type, template required");
            }

            const result = await this.messageService.sendMessage({
                contactId,
                eventId,
                type,
                template
            });

            return res.status(202).json({
                success: true,
                message: "Message queued",
                data: result
            })

        } catch (error) {
            next(error);
        }
    }
    getMessages = async (req: Request, res: Response, next: NextFunction) => {

        try {
            const contactId = req.query.contactId as string;
            const eventId = req.query.eventId as string;
            const email = req.query.email as string;
            const phone = req.query.phone as string;

            const result = await this.messageService.getMessages(contactId, eventId, email, phone)

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

}
