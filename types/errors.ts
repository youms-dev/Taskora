export type ApiError = {
    datas?: {
        error: string;
        message: string;
        statusCode: number;
    };
    message: string;
    status?: number;
}