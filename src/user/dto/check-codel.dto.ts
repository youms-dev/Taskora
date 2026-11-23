import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { OAuthLoginDto } from 'src/auth/dto/oaut-login.dto';
import { CheckEmailDto } from './check-email.dto';

export class CheckCodeDto extends IntersectionType(
    CheckEmailDto,
    PartialType(PickType(OAuthLoginDto, ["provider"])),
) {
    @IsString({
        message: "code must be a string!",
    })
    code: string;
}