import { OmitType } from "@nestjs/mapped-types";
import { IsEnum } from "class-validator";
import { SESSION_PROVIDER } from "src/database/entities/user.entity";
import { RegisterDto } from "./register.dto";

export class OAuthRegisterDto extends OmitType(RegisterDto, ["password"]) {
    @IsEnum(SESSION_PROVIDER, {
        message: "provider must be a string",
    })
    provider: SESSION_PROVIDER;
}