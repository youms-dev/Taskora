export type LengthField = {
    min: number;
    max?: number;
}

export const EMAIL_LENGTH: LengthField = {
    min: 10,
    max: 100,
};

export const PASSWORD_LENGTH: LengthField = {
    min: 8,
};