import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

export enum DEVICE_TYPE {
    IOS = "IOS",
    ANDROID = "ANDROID",
}

@Entity()
export class Session {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_session",
    })
    idSession: string;

    @Column({
        name: "id_device",
        nullable: true,
        unique: true,
    })
    idDevice: string;

    @Column({
        name: "device_name",
    })
    deviceName: string;

    @Column({
        name: "device_brand",
    })
    deviceBrand: string;

    @Column({
        name: "device_type",
        type: "enum",
        enum: DEVICE_TYPE,
    })
    deviceType: DEVICE_TYPE;

    @Column({
        name: "refresh_token",
    })
    refreshToken: string;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt?: Date;

    @UpdateDateColumn({
        name: "last_connection",
    })
    lastConnection?: Date;

    @ManyToOne(() => User, (user) => user.session, {
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "id_user",
    })
    user: User;
}