import { OmitType } from '@nestjs/mapped-types';
import { IsString } from "class-validator";
import { OAuthLoginDto } from './oaut-login.dto';

export class _2FADto extends OmitType(OAuthLoginDto, ["provider"]) {
    @IsString({
        message: "code must be a string",
    })
    code: string;
}