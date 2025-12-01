import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions.js";
import "dotenv/config";

export const Config: PostgresConnectionOptions = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    port: Number(process.env.DATABASE_PORT),
    entities: [__dirname + "/**/*.entity{.ts,.js}"],
    synchronize: Boolean(Number(process.env.PRODUCTION)),
}