export type TaskType = {
    idTask: string;
    idFolder?: string;
    title?: string;
    content: string;
    icon?: string;
    done: boolean;
    archived: boolean;
    plannedDate: number;
    type: "event" | "task";
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteTaskType = {
    id_task: string;
    id_folder?: string;
    title?: string;
    icon?: string;
    content: string;
    done: boolean;
    planned_date: number;
    archived: boolean;
    type: "event" | "task";
    created_at: Date;
    updated_at: Date;
}