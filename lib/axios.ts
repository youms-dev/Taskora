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
                status: error.response?.status,
            });
        }

        return Promise.reject({
            data: {
                error: "Une erreur s'est produite",
            },
            status: 500,
        });
    }
);
