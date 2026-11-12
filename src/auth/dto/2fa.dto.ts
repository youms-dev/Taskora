import { OmitType } from '@nestjs/mapped-types';
import { IsInt } from "class-validator";
import { OAuthLoginDto } from './oaut-login.dto';

export class _2FADto extends OmitType(OAuthLoginDto, ["provider"]) {
    @IsInt({
        message: "code must be an integer",
    })
    code: number;
}