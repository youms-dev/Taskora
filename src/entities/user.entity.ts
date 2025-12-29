import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid", {
        name: "id_user",
    })
    iduser: string;

    @Column()
    name: string;

    @Column({
        unique: true
    })
    email: string;

    @Column({
        name: "photo_url",
        default: "",
    })
    photoUrl: string;

    @Column({
        name: "onboarding_complete",
        default: false
    })
    onBoardingComplete: boolean;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt: Date

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt: Date
}
