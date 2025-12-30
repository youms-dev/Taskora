export type LengthField = {
    min: number;
    max?: number;
}

export const EMAIL_LENGTH: LengthField = {
    min: 10,
    max: 100,
};

export const NAME_LENGTH: LengthField = {
    min: 3,
    max: 30,
};