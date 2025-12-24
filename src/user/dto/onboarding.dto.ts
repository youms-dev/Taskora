import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class OnboardingDto extends PickType(CreateUserDto, ["name"]) {
    @IsString()
    @IsNotEmpty()
    photoUrl: string;
}
