import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Task {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_task",
    })
    idTask: string;

    @Column({ unique: true })
    content: string;

    @Column({ default: false })
    done: boolean;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.task, {
        onDelete: "CASCADE",
    })
    @JoinColumn()
    user: User
}
