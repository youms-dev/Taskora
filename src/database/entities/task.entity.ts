import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Folder } from './folder.entity';
import { User } from './user.entity';

export enum TaskType {
    TASK = "TASK",
    EVENT = "EVENT",
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_task",
    })
    idTask: string;

    @Column({
        type: "text",
        nullable: true,
    })
    title?: string;

    @Column({
        type: "text",
        nullable: true,
    })
    content?: string;

    @Column({
        type: "json",
        nullable: true,
    })
    icon?: string;

    @Column({
        nullable: true,
    })
    done?: boolean;

    @Column({
        nullable: true,
    })
    archived?: boolean;

    @Column({
        name: "start_at",
        type: "bigint",
    })
    startAt: number;

    @Column({
        name: "end_at",
        nullable: true,
    })
    endAt?: Date;

    @Column({
        type: "enum",
        default: TaskType.TASK,
        enum: TaskType,
    })
    type?: TaskType;

    @Column({
        name: "remind_before",
        nullable: true,
    })
    remindBefore?: number;

    @Column({
        nullable: true,
    })
    pinned?: boolean;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt?: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt?: Date;

    @ManyToOne(() => Folder, (folder) => folder.tasks, {
        onDelete: "SET NULL",
        nullable: true,
    })
    @JoinColumn({
        name: "id_folder",
    })
    folder: Folder;

    @ManyToOne(() => User, (user) => user.tasks, {
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "id_user",
    })
    user: User;
}
