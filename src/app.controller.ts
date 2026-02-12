import { Get } from "@nestjs/common";

export class Controller {
    @Get()
    greeting() {
        return "Youms todolist";
    }
}