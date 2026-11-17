import { PickType } from "@nestjs/mapped-types";
import { IsString } from "class-validator";
import { LoginDto } from "./login.dto";

export class LogoutDto extends PickType(LoginDto, ["email"]) {
    @IsString({
        message: "Device id must be a string",
    })
    idDevice: string;
}