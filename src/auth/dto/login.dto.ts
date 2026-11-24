import { OmitType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RegisterDto } from "./register.dto";

export class LoginDto extends OmitType(RegisterDto, ["photo", "password"]) {
    @IsOptional()
    @IsString({
        message: "Device id must be a string",
    })
    @IsNotEmpty({
        message: "Device id cannot be empty",
    })
    idDevice?: string;

    @IsString({
        message: "password must be a string",
    })
    @IsNotEmpty({
        message: "password cannot be empty!",
    })
    password: string;
}