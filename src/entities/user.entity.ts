import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_user",
    })
    iduser: string;

    @Column({
        unique: true
    })
    email: string;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt: Date

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt: Date
}
