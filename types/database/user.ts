export type UserType = {
    idUser: string;
    idSetting: string;
    name?: string | null;
    email: string;
    photo?: string | null;
    provider: AUTH_PROVIDER,
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteUserType = {
    id_user: string;
    id_setting: string;
    name?: string | null;
    email: string;
    photo?: string | null;
    provider: AUTH_PROVIDER,
    created_at: Date;
    updated_at: Date;
}

export enum AUTH_PROVIDER {
    GOOGLE = "GOOGLE",
}