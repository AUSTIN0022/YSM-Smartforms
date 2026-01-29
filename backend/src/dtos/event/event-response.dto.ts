export interface EventResponseDTO {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    status: "DRAFT" | "ACTIVE" | "CLOSED";
    paymentEnabled: boolean;
    paymentConfig?: {
        amount: number;
        currency: string;
        description: string | null;
    };
}