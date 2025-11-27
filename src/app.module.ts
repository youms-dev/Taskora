import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaskModule } from './task/task.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TaskModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      port: 5432,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
