export type SettingType = {
    idSetting: string;
    idUser: string;
    language?: "en" | "fr" | null;
    confirmBeforeDelete?: boolean | null;
    notificationSound?: string | null;
    _2FA?: boolean | null;
    autoSync?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteSettingType = {
    id_setting: string;
    id_user: string;
    language?: "en" | "fr" | null;
    confirm_before_delete?: boolean | null;
    notification_sound?: string | null;
    _2FA?: boolean | null;
    auto_sync?: boolean | null;
    created_at: Date;
    updated_at: Date;
}

export type NotificationSoundType = {
    name: string;
    fileName: string;
}