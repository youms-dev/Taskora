export type TaskType = {
    idTask: string;
    idFolder?: string;
    title?: string;
    icon?: string;
    content?: string;
    done?: boolean;
    archived: boolean;
    plannedDate: number;
    startAt: Date;
    endAt?: Date;
    type: "event" | "task";
    remindBefore?: number;
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteTaskType = {
    id_task: string;
    id_folder?: string;
    title?: string;
    icon?: string;
    content?: string;
    done?: boolean;
    archived: boolean;
    planned_date: number;
    start_at: Date;
    end_at?: Date;
    type: "event" | "task";
    remind_before?: number;
    created_at: Date;
    updated_at: Date;
}