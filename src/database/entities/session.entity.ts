import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Session {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_session",
    })
    idSession: string;

    @Column()
    device: string;

    @Column({
        name: "refresh_token",
    })
    refreshToken: string;

    @Column({
        name: "last_connection",
    })
    lastConnection: string;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt?: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt?: Date;

    @ManyToOne(() => User, (user) => user.session, {
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "id_user",
    })
    user: User;
}