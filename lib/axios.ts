import { ApiError } from "@/types/errors";
import axios from "axios";

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACK_END_URL,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error)) {
            return Promise.reject({
                data: error.response?.data,
                status: error.response?.status ?? 500,
            } as ApiError);
        }

        return Promise.reject({
            data: {
                message: "Une erreur s'est produite",
            },
            status: 500,
        } as ApiError);
    }
);
