import { config } from "dotenv";
import { DataSource } from "typeorm";

config({
    path: [".env", ".env.development"],
});

export const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: true,
    entities: [__dirname + "/**/*.entity{.ts,.js}"],
    migrations: ["src/migrations/*.ts"],
});