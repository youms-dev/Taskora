import { Body, Controller, Delete, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
    constructor(private readonly service: TaskService) { }

    @Post("list")
    tasks() {
        return this.service.find();
    }

    @Post("find/:value")
    task(@Param("value") value: CreateTaskDto["content"]) {
        return this.service.findOne(value);
    }

    @Post("create")
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() datas: CreateTaskDto) {
        return this.service.create(datas);
    }

    @Patch("update/:content")
    update(@Param("content") content: string, @Body() datas: UpdateTaskDto) {
        return this.service.update(content, datas);
    }

    @Delete("delete/:value")
    delete(@Param("value") value: CreateTaskDto["content"]) {
        return this.service.delete(value);
    }
}
