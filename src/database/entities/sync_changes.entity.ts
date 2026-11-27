import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum EntityTable {
    TASK = "TASK",
    FOLDER = "FOLDER",
}

export enum SyncAction {
    INSERT = "INSERT",
    DELETE = "DELETE",
}

@Entity()
export class SyncChanges {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        name: "id_entity",
    })
    idEntity: string;

    @Column({
        generated: "increment",
    })
    cursor: number;

    @Column({
        type: "enum",
        enum: EntityTable,
    })
    entity_table: EntityTable;

    @Column({
        type: "enum",
        enum: SyncAction,
    })
    action: SyncAction;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt?: Date;
}