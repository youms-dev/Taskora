import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, Query, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { PaginationDto } from './dto/pagination.dto';
import { DeleteTaskDto } from './dto/delete-task.dto copy';

@Controller('task')
export class TaskController {
    constructor(private readonly service: TaskService) { }

    @Post("list")
    tasks(@Query() { skip, take }: PaginationDto) {
        return this.service.find({ skip, take });
    }
    
    @HttpCode(HttpStatus.OK)
    @Post("find/:id")
    task(@Param("id") id: UpdateTaskDto["idTask"]) {
        return this.service.findOne(id);
    }

    @Post("create")
    create(@Body() datas: CreateTaskDto) {
        return this.service.create(datas);
    }

    @Patch("update/:id")
    update(@Param("id") id: string, @Body() datas: UpdateTaskDto) {
        return this.service.update(id, datas);
    }

    @Delete("delete")
    delete(@Body() datas: { tasks: DeleteTaskDto[] }) {
        return this.service.delete(datas.tasks);
    }

    @Post("count")
    count() {
        return this.service.count();
    }
}
