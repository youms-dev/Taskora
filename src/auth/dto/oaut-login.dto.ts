import { OmitType } from '@nestjs/mapped-types';
import { IsEnum } from "class-validator";
import { SESSION_PROVIDER } from 'src/database/entities/session.entity';
import { LoginDto } from './login.dto';

export class OAuthLoginDto extends OmitType(LoginDto, ["password"]) {
    @IsEnum(SESSION_PROVIDER, {
        message: "Invalid provider!",
    })
    provider: SESSION_PROVIDER;
}