import { PickType } from "@nestjs/mapped-types";
import { UpdateTaskDto } from "./update-task.dto";

export class DeleteTaskDto extends PickType(UpdateTaskDto, ["idTask"]) {
    
}