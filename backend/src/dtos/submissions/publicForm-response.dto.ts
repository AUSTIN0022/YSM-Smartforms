import { PublicFormFieldDTO } from './publicFormField.dto';

export interface PublicFormResponseDTO {
    event: {
        id: string;
        title: string;
        slug: string;
    };

    form: {
        id: string;
        isMultiStep: boolean;
        settings?:any;
        publishedAt: Date;

        steps?: Array<{
            id: string;
            stepNumber: number;
            title?: string;
            description?: string;
            fields: PublicFormFieldDTO[];
        }>;

        fields?: PublicFormFieldDTO[];
    };
}