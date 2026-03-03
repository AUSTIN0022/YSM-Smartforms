import { Contact } from "@prisma/client";
import { prisma } from "../config/db";

export interface IContactRepository {
 
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

    findById(id: string): Promise<Contact | null>;
    findByEmail(email: string): Promise<Contact | null>;
    findByPhone(phone: string): Promise<Contact | null>;

    findContactByEmailOrPhone(
        email?: string,
        phone?: string
    ): Promise<Contact | null>;

    /**
     * Returns all event IDs linked to a contact via ContactEvent.
     * Used to auto-resolve eventId when sending messages from the Contacts tab.
     */
    findEventIdsByContactId(contactId: string): Promise<string[]>;

}


export class contactRepository implements IContactRepository {
    
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

    async findById(id: string): Promise<Contact | null> {
        return prisma.contact.findUnique({
            where: { id }
        });
    }

    async findByEmail(email: string): Promise<Contact | null> {
        return prisma.contact.findUnique({
            where: { email }
        });
    }

    async findByPhone(phone: string): Promise<Contact | null> {
        return prisma.contact.findUnique({
            where: { phone }
        });
    }

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

    async findEventIdsByContactId(contactId: string): Promise<string[]> {
        const rows = await prisma.contactEvent.findMany({
            where: { contactId },
            select: { eventId: true },
        });
        return rows.map((r) => r.eventId);
    }

    
}