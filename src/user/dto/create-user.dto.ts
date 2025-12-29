import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @MinLength(10)
    @IsEmail()
    email: string;
}
