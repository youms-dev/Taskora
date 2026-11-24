import { OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty } from "class-validator";
import { SESSION_PROVIDER } from 'src/database/entities/user.entity';
import { LoginDto } from './login.dto';

export class OAuthLoginDto extends OmitType(LoginDto, ["password"]) {
    @IsEnum(SESSION_PROVIDER, {
        message: "Invalid provider!",
    })
    @IsNotEmpty({
        message: "provider cannot be empty!",
    })
    provider: SESSION_PROVIDER;
}