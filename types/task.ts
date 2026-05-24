export type TaskType = {
    idTask: string;
    title?: string;
    content: string;
    done: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteTaskType = {
    id_task: string;
    title?: string;
    content: string;
    done: boolean;
    created_at: Date;
    updated_at: Date;
}