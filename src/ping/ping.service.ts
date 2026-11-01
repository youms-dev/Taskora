import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class PingService {
    @Cron("0 0 0 */6 * *")
    handleCron() {
        console.log("Yo");
    }
}