import { PickType } from '@nestjs/mapped-types';
import { LoginDto } from './login.dto';

export class ResendCodeDto extends PickType(LoginDto, ["email"]) { }