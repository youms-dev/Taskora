export type AuthType = {
    accessToken: string;
    refreshToken: string;
    email: string;
    photo?: string | null;
}

export type LocalAuthType = {
    enabled: boolean;
    code: string;
    systemAuth: boolean;
}

export type AttemptsType = {
    attempts: number;
    expiresAt: number;
}