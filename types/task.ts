export type TaskType = {
    idTask: string;
    idFolder?: string | null;
    title?: string | null;
    icon?: string | null;
    content?: string | null;
    done?: boolean | null;
    archived: boolean;
    startAt: Date;
    endAt?: Date | null;
    type: "event" | "task";
    remindBefore?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export type SQLiteTaskType = {
    id_task: string;
    id_folder?: string | null;
    title?: string | null;
    icon?: string | null;
    content?: string | null;
    done?: number | null;
    archived: number;
    start_at: number;
    end_at?: Date | null;
    type: "event" | "task";
    remind_before?: number | null;
    created_at: Date;
    updated_at: Date;
}