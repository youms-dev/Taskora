import { Redis } from '@upstash/redis';
import { config } from "dotenv";

config({
    path: [".env", ".env.development"],
    quiet: true,
});

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});