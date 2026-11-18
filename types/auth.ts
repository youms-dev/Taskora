export type AuthType = {
    accessToken: string;
    refreshToken: string;
    email: string;
}

export type LocalAuthType = {
    enabled: boolean;
    code: string;
    systemAuth: boolean;
}

export type AuthAttemptsType = {
    attempts: number;
    expiresAt: number;
}