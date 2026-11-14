export type SessionType = {
    idSession: string;
    idUser: string;
    idDevice: string;
    deviceName: string;
    deviceType: DeviceTypeEnum;
    deviceBrand: string;
    lastConnection: Date;
    createdAt: Date;
}

export type SQLiteSessionType = {
    id_session: string;
    id_user: string;
    id_device: string;
    device_name: string;
    device_type: DeviceTypeEnum;
    device_brand: string;
    last_connection: Date;
    created_at: Date;
}

export enum DeviceTypeEnum {
    ANDROID = "ANDROID",
    IOS = "IOS",
}