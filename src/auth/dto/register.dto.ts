import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDTO {
    @IsString()
    @MinLength(3)
    name: string;
    
    @IsString()
    @IsEmail()
    @MinLength(10)
    email: string;
    
    @IsString()
    @MinLength(8)
    password: string;
}