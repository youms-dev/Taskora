import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from '@supabase/supabase-js';
import { Task } from 'src/entities/task.entity';
import { User } from 'src/entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteTaskDto } from './dto/delete-task.dto copy';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task) private repo: Repository<Task>,
        @InjectRepository(User) private userRepo: Repository<User>
    ) { }

    async create(datas: CreateTaskDto, authUser: AuthUser) {
        const user = await this.userRepo.findOne({
            where: {
                email: authUser.email,
            }
        });

        if (!authUser) throw new NotFoundException("User not found");
        const taskSearched = await this.repo.findOne({
            where: {
                content: datas.content,
                user: {
                    email: authUser.email,
                }
            }
        });

        if (taskSearched) throw new ConflictException("Cette tâche existe déjà !");

        const task = this.repo.create({
            ...datas,
            user: {
                ...user
            }
        });

        return await this.repo.save(task);
    }

    async update(id: UpdateTaskDto["idTask"], datas: UpdateTaskDto, authUser: AuthUser) {
        const user = await this.userRepo.findOne({
            where: {
                email: authUser.email,
            }
        });

        if (!user) throw new NotFoundException("User not found");
        const task = await this.repo.findOne({
            where: {
                idTask: id,
                user: {
                    email: user.email,
                }
            }
        });

        if (!task) throw new NotFoundException("Tâche inexistante");
        return await this.repo.update({
            idTask: task.idTask,
        },
            {
                content: datas.content,
                done: datas.done,
            }
        )
    }

    async find({ skip, take }: PaginationDto, authUser: AuthUser) {
        const user = await this.userRepo.findOne({
            where: {
                email: authUser.email,
            }
        });

        if (!user) throw new NotFoundException("User not found");

        return await this.repo.find({
            skip: skip ? +skip : undefined,
            take: take ? +take : undefined,
            order: {
                updatedAt: "desc",
            },
            relations: {
                user: true,
            },
            where: {
                user: {
                    email: user.email
                }
            }
        });
    }

    async findOne(data: UpdateTaskDto["idTask"], authUser: AuthUser) {
        const user = await this.userRepo.findOne({
            where: {
                email: authUser.email,
            }
        });

        if (!user) throw new NotFoundException("User not found");
        const task = await this.repo.findOne({
            where: {
                idTask: String(data),
                user: {
                    email: user.email,
                }
            },
            relations: {
                user: true,
            }
        });

        if (!task) throw new NotFoundException("Tâche inexistante");
        return task;
    }

    async delete(datas: DeleteTaskDto[], authUser: AuthUser) {
        const user = await this.userRepo.findOne({
            where: {
                email: authUser.email,
            }
        });

        if (!user) throw new NotFoundException("User not found");
        const tasks = await this.repo.find({
            where: {
                idTask: In([...datas]),
                user: {
                    email: user.email
                }
            }
        });

        if (!tasks) throw new NotFoundException("Aucune tâche trouvée");
        return this.repo.delete({
            idTask: In([...tasks.map(task => task.idTask)]),
        });
    }

    async count(authUser: AuthUser) {
        const user = await this.userRepo.findOne({
            where: {
                email: authUser.email,
            }
        });

        if (!user) throw new NotFoundException("User not found");
        return await this.repo.count({
            where: {
                user: {
                    email: user.email,
                }
            }
        });
    }
}
