import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AuthModule } from './auth/auth.module';
import { dataSource } from "./datasource";
import { PingModule } from "./ping/ping.module";
import { TaskModule } from "./task/task.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.development"],
    }),
    TaskModule,
    TypeOrmModule.forRoot(dataSource.options),
    UserModule,
    JwtModule.register({}),
    PingModule,
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
