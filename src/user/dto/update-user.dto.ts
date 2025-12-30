import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { NAME_REGEX } from 'src/constants/regex';
import { NAME_LENGTH } from 'src/constants/lengths';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @IsNotEmpty()
    iduser: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(NAME_LENGTH.min)
    @MaxLength(NAME_LENGTH.max ?? 30)
    @IsOptional()
    @Matches(NAME_REGEX, {
        message: "Invalid name format"
    })
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    photoUrl: string;
}
