import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Setting {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_setting",
    })
    idSetting: string;

    @Column({
        default: null,
    })
    language?: string;

    @Column({
        name: "confirm_before_delete",
        default: true,
    })
    confirmBeforeDelete?: boolean;

    @Column({
        default: true,
    })
    _2FA?: boolean;

    @Column({
        name: "auto_sync",
        default: true,
    })
    autoSync?: boolean;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt: Date;

    @OneToMany(() => User, (user) => user.setting, {
        onDelete: "CASCADE",
    })
    user: User;
}
