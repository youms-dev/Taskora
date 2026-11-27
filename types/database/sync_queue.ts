export type SyncQueueType = {
    id: string;
    idEntity: string;
    entityTable: SyncTable;
    action: SyncAction;
    createdAt: Date;
}

export type SQLiteSyncQueueType = {
    id: string;
    id_entity: string;
    entity_table: SyncTable;
    action: SyncAction;
    created_at: Date;
}

export enum SyncTable {
    TASK = "TASK",
    FOLDER = "FOLDER",
} 

export enum SyncAction {
    INSERT = "INSERT",
    DELETE = "DELETE",
} 