export type SessionType = {
    idSession: string;
    idUser: string;
    idDevice: string;
    deviceName: string;
    deviceType: DeviceType;
    deviceBrand: string;
    deviceModel: string;
    lastConnection: Date;
    createdAt: Date;
}

export type SQLiteSessionType = {
    id_session: string;
    id_user: string;
    id_device: string;
    device_name: string;
    device_type: DeviceType;
    device_brand: string;
    device_model: string;
    last_connection: Date;
    created_at: Date;
}

export enum DeviceType {
    ANDROID = "ANDROID",
    IOS = "IOS",
}