import { MessageType } from "@prisma/client";
import { EmailProvider } from "./email.provider";
import { WhatsAppProvider } from "./whatsapp.provider";


export class MessageProvider {
    static getProvider(type: MessageType) {
        switch(type) {
            case "EMAIL":
                return new EmailProvider();
            case "WHATSAPP":
                return new WhatsAppProvider();
                
            default:
                throw new Error(`Unsupported message type: ${type}`);
        }
    }
}