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
    pinned?: boolean;
    remindBefore?: number | null;
    notificationId: string;
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
    pinned?: number;
    remind_before?: number | null;
    notification_id: string;
    created_at: Date;
    updated_at: Date;
}