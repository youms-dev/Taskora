import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Task } from "./task.entity";
import { User } from "./user.entity";

@Entity()
export class Folder {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_folder",
    })
    idFolder: string;

    @Column()
    title: string;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt?: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt?: Date;

    @OneToMany(() => Task, (task) => task.folder)
    tasks: Task[];

    @ManyToOne(() => User, (user) => user.folders, {
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "id_user",
    })
    user: User;
}