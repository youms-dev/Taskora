import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from "class-validator";
import { RegisterDto } from "./register.dto";

export class LoginDto extends OmitType(RegisterDto, ["photo"]) {
    @IsOptional()
    @IsString()
    idDevice?: string;
}