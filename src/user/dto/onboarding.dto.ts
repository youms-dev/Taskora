import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class OnboardingDto extends PickType(CreateUserDto, ["email"]) {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @IsNotEmpty()
    photoUrl: string;
}
