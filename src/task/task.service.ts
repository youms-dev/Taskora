import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/entities/task.entity';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Response } from 'src/utils/response';

@Injectable()
export class TaskService {
    constructor(@InjectRepository(Task) private repo: Repository<Task>) { }

    async create(datas: CreateTaskDto) {
        return await this.repo.save(datas);
    }

    async update(content: string, datas: UpdateTaskDto) {
        const task = await this.repo.findOne({
            where: {
                content
            }
        })

        if (!task) throw new NotFoundException("Tâche inexistante");

        await this.repo.update({
            idTask: task.idTask
        },
            datas
        )

        return Response("Fait");
    }

    async find() {
        return await this.repo.find();
    }

    async findOne(data: CreateTaskDto["content"]) {
        const task = await this.repo.findOne({
            where: {
                content: String(data)
            }
        })

        if (!task) throw new NotFoundException("Tâche inexistante");
        return task;
    }

    async delete(value: CreateTaskDto["content"]) {
        const task = await this.findOne(value);

        if (task) {
            await this.repo.delete({
                content: value
            })

            return Response("Suppression effectuée");
        }
    }
}
