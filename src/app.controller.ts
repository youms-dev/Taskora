import { Controller, Get } from "@nestjs/common";
import { APP_NAME } from "./constants/names";

@Controller()
export class AppController {
    @Get()
    app() {
        return APP_NAME;
    }
}