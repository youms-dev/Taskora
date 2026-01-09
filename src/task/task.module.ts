import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from 'src/entities/task.entity';
import { SupabaseAuthGuard } from 'src/guards/auth/auth.guard';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User])],
  controllers: [TaskController],
  providers: [TaskService, SupabaseAuthGuard]
})
export class TaskModule { }
