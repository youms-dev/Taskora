import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User])],
  controllers: [TaskController],
  providers: [TaskService, JwtStrategy, JwtAuthGard],
})
export class TaskModule { }
