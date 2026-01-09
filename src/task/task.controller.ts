import { Body, Controller, Delete, Param, Patch, Post, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { PaginationDto } from './dto/pagination.dto';
import { DeleteTaskDto } from './dto/delete-task.dto copy';
import { SupabaseAuthGuard } from 'src/guards/auth/auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('task')
export class TaskController {
    constructor(private readonly service: TaskService) { }
    
    @Post("list")
    tasks(@Query() { skip, take }: PaginationDto, @Req() req) {
        return this.service.find({ skip, take }, req.user);
    }

    @HttpCode(HttpStatus.OK)
    @Post("find/:id")
    task(@Param("id") id: UpdateTaskDto["idTask"], @Req() req) {
        return this.service.findOne(id, req.user);
    }

    @Post("create")
    create(@Body() datas: CreateTaskDto, @Req() req) {
        return this.service.create(datas, req.user);
    }

    @Patch("update/:id")
    update(@Param("id") id: string, @Body() datas: UpdateTaskDto, @Req() req) {
        return this.service.update(id, datas, req.user);
    }

    @Delete("delete")
    delete(@Body() datas: { tasks: DeleteTaskDto[] }, @Req() req) {
        return this.service.delete(datas.tasks, req.user);
    }

    @Post("count")
    count(@Req() req) {
        return this.service.count(req.user);
    }
}
