import { PickType } from '@nestjs/mapped-types';
import { CheckEmailDto } from './check-email.dto';

export class resendCodeDto extends PickType(CheckEmailDto, ["email"]) { }