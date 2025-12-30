import axios from "axios";

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACK_END_URL,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.message ||
                "Erreur serveur";

            return Promise.reject({
                status: error.response?.status,
                message,
                data: error.response?.data,
            });
        }

        return Promise.reject({
            message: "Erreur inconnue",
        });
    }
);
