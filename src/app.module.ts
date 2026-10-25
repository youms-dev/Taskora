import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TaskModule } from "./task/task.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { dataSource } from "./datasource";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.development"],
    }),
    TaskModule,
    TypeOrmModule.forRoot(dataSource.options),
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
