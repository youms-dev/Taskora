import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @MinLength(10)
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}
