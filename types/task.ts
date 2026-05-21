export type Task = {
    idTask?: string;
    title?: string;
    content: string;
    done: boolean;
    createdAt: Date;
    updatedAt: Date;
}