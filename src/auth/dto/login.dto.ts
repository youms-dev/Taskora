import { OmitType } from '@nestjs/mapped-types';
import { IsEmail, IsString, MinLength } from "class-validator";
import { RegisterDTO } from './register.dto';

export class LoginDTO extends OmitType(RegisterDTO, ['name']) {
    @IsString()
    @IsEmail()
    @MinLength(10)
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}