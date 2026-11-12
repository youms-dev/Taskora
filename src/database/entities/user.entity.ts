import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Folder } from "./folder.entity";
import { Session } from "./session.entity";
import { Setting } from "./setting.entity";
import { Task } from "./task.entity";

export enum SESSION_PROVIDER {
    GOOGLE = "GOOGLE",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_user",
    })
    idUser: string;

    @Column({
        nullable: true,
    })
    name?: string;

    @Column({
        unique: true,
    })
    email: string;

    @Column({
        nullable: true,
    })
    password?: string;

    @Column({
        nullable: true,
    })
    photo?: string;

    @Column({
        type: "enum",
        enum: SESSION_PROVIDER,
        nullable: true,
    })
    provider?: SESSION_PROVIDER;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt?: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt?: Date;

    @OneToMany(() => Task, (task) => task.user)
    tasks: Task[];

    @OneToMany(() => Session, (session) => session.user)
    session: Task[];

    @OneToOne(() => Setting, (setting) => setting.user, {
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "id_setting",
    })
    setting: Setting;

    @OneToOne(() => Folder, (folder) => folder.user)
    folders: Folder[];
}
