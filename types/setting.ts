export type SettingType = {
    idSetting: string;
    idUser: string;
    language?: "en" | "fr" | null;
    confirmBeforeDelete?: boolean | null;
    notificationSound?: string | null;
    enable2FA?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteSettingType = {
    id_setting: string;
    id_user: string;
    language?: "en" | "fr" | null;
    confirm_before_delete?: boolean | null;
    notification_sound?: string | null;
    enable_2FA?: boolean | null;
    created_at: Date;
    updated_at: Date;
}

export type NotificationSoundType = {
    name: string;
    fileName: string;
}