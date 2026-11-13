
import { LOGOUT } from "@/constants/emitters";
import { AUTH_STORE } from "@/constants/secure-store";
import { AuthType } from "@/types/auth";
import { ApiError } from "@/types/errors";
import axios, { InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { emitter } from "./event-emitter";

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACK_END_URL,
});

interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use(
    async (req) => {
        const authData = await SecureStore.getItemAsync(AUTH_STORE);

        if (authData) {
            const { accessToken } = JSON.parse(authData) as AuthType;

            if (accessToken) {
                req.headers.Authorization = `Bearer ${accessToken}`;
            }
        }

        return req;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject({
                data: {
                    message: "An error occurred!",
                },
                status: 500,
            } as ApiError);
        }

        const req = error.config as RetryConfig | undefined;

        if (
            error.response?.status !== 401
            ||
            !req
            ||
            req._retry
            ||
            req.url?.includes("/auth/refresh")
        ) {
            return Promise.reject({
                data: error.response?.data,
                status: error.response?.status ?? 500,
            } as ApiError);
        }

        req._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = (async () => {
                    const authData = await SecureStore.getItemAsync(AUTH_STORE);

                    if (!authData) {
                        throw new Error("No authentication data");
                    }

                    const { refreshToken } = JSON.parse(authData) as AuthType;

                    if (!refreshToken) {
                        throw new Error("No refresh token");
                    }

                    const { data } = await axios.post<AuthType>(
                        `${api.defaults.baseURL}/auth/refresh`,
                        { refreshToken }
                    );

                    await SecureStore.setItemAsync(AUTH_STORE, JSON.stringify(data));

                    return data.accessToken;
                })();
            }

            const accessToken = await refreshPromise;

            req.headers.Authorization = `Bearer ${accessToken}`;

            return api(req);
        } catch {
            emitter.emit(LOGOUT);
            await SecureStore.deleteItemAsync(AUTH_STORE);

            return Promise.reject({
                data: { message: "Session expired" },
                status: 401,
            } as ApiError);

        } finally {
            refreshPromise = null;
        }
    }
);
