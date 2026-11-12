import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from "class-validator";
import { RegisterDto } from "./register.dto";

export class LoginDto extends OmitType(RegisterDto, ["photo", "password"]) {
    @IsOptional()
    @IsString()
    idDevice?: string;

    @IsString({
        message: "password must be a string",
    })
    password: string;
}