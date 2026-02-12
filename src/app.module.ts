import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaskModule } from './task/task.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from './config';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TaskModule,
    TypeOrmModule.forRoot(Config),
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
