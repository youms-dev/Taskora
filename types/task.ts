export type TaskType = {
    idTask: string;
    idFolder?: string;
    title?: string;
    content: string;
    done: boolean;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteTaskType = {
    id_task: string;
    id_folder?: string;
    title?: string;
    content: string;
    done: boolean;
    archived: boolean;
    created_at: Date;
    updated_at: Date;
}