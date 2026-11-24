import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { _2FADto } from 'src/auth/dto/_2fa.dto';
import { OAuthLoginDto } from 'src/auth/dto/oaut-login.dto';
import { CheckEmailDto } from './check-email.dto';

export class CheckCodeDto extends IntersectionType(
    CheckEmailDto,
    PartialType(PickType(OAuthLoginDto, ["provider"])),
    PickType(_2FADto, ["code"]),
) { }