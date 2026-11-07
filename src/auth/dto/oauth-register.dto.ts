import { OmitType } from "@nestjs/mapped-types";
import { RegisterDto } from "./register.dto";
import { IsEnum } from "class-validator";
import { SESSION_PROVIDER } from "src/database/entities/session.entity";

export class OAuthRegisterDto extends OmitType(RegisterDto, ["password"]) { 
    @IsEnum(SESSION_PROVIDER, {
        message: "provider must be a string",
    })
    provider: SESSION_PROVIDER; 
}