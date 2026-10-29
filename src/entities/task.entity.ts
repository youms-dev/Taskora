import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Folder } from './folder.entity';

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

    @Column()
    title?: string;

    @Column()
    content: string;

    @Column({
        type: "json",
    })
    icon?: string;

    @Column({ default: false })
    done: boolean;

    @Column({ default: null })
    archived?: boolean;

    @Column({
        name: "start_at",
    })
    startAt: number;

    @Column({
        name: "end_at",
        default: null,
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
        default: null,
    })
    remindBefore?: number;

    @Column()
    pinned?: boolean;

    @Column({
        name: "notification_id",
    })
    notificationId: string;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt?: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt?: Date;

    @ManyToOne(() => Folder, (folder) => folder.tasks,
        {
            onDelete: "CASCADE",
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
