import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { PaginationDto } from './dto/pagination.dto';

@Controller('task')
export class TaskController {
    constructor(private readonly service: TaskService) { }

    @Post("list")
    tasks(@Query() { skip, take }: PaginationDto) {
        return this.service.find({ skip, take });
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

    @Delete("delete/:id")
    delete(@Param("id") id: UpdateTaskDto["idTask"]) {
        return this.service.delete(id);
    }

    @Post("count")
    count() {
        return this.service.count();
    }
}
