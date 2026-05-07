import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    app() {
        return "Taskora";
    }

    @Get("hello")
    greeting() {
        return this.appService.getHello();
    }
}