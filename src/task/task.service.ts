import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/entities/task.entity';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Response } from 'src/utils/response';
import { PaginationDto } from './dto/pagination.dto';
import { DeleteTaskDto } from './dto/delete-task.dto copy';

@Injectable()
export class TaskService {
    constructor(@InjectRepository(Task) private repo: Repository<Task>) { }

    async create(datas: CreateTaskDto) {
        return await this.repo.save(datas);
    }

    async update(id: UpdateTaskDto["idTask"], datas: UpdateTaskDto) {
        const task = await this.repo.findOne({
            where: {
                idTask: id
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

    async find({ skip, take }: PaginationDto) {
        return await this.repo.find({
            skip: skip ? +skip : 0,
            take: take ? +take : 1,
            order: {
                updatedAt: "desc",
            }
        });
    }

    async findOne(data: UpdateTaskDto["idTask"]) {
        const task = await this.repo.findOne({
            where: {
                idTask: String(data)
            }
        })

        if (!task) throw new NotFoundException("Tâche inexistante");
        return task;
    }

    async delete(datas: DeleteTaskDto[]) {
        const tasks = await this.repo.find();

        if(!tasks) throw new NotFoundException();
        return await this.repo.delete(datas)
    }

    async count() {
        return await this.repo.count();
    }
}
