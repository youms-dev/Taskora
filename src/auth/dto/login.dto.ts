import { PickType } from '@nestjs/mapped-types';
import { IsString } from "class-validator";
import { RegisterDto } from "./register.dto";

export class LoginDto extends PickType(RegisterDto, ["email"]) {
    @IsString()
    password: string;
}