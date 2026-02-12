import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Task } from "./task.entity";

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
    createdAt: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt: Date;

    @OneToMany(() => Task, (task) => task.user, {
        onDelete: "CASCADE",
    })
    task: Task[];
}
