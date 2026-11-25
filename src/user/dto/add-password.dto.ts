import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CheckEmailDto } from './check-email.dto';

export class AddPasswordDto extends IntersectionType(
    PickType(CheckEmailDto, ["email"]),
    PickType(RegisterDto, ["password"]),
) { }