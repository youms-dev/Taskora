import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @IsString({
        message: "L'id doit être de type String !"
    })
    @IsOptional()
    @IsNotEmpty({
        message: "L'id ne doit pas être vide"
    })
    @IsUUID()
    idTask: string;
}