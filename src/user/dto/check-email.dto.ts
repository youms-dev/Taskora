import { PickType } from '@nestjs/mapped-types';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LoginDto } from 'src/auth/dto/login.dto';
import { EMAIL_FORMAT_ERROR, EMAIL_LENGTH_ERROR } from 'src/constants/errors';
import { EMAIL_REGEX } from 'src/constants/regex';

export class CheckEmailDto extends PickType(LoginDto, ["email"]) {
    @MinLength(8, {
        message: EMAIL_LENGTH_ERROR,
    })
    @MaxLength(100, {
        message: EMAIL_LENGTH_ERROR,
    })
    @IsString({
        message: "new email must be a string!",
    })
    @Matches(EMAIL_REGEX, {
        message: EMAIL_FORMAT_ERROR,
    })
    newEmail: string;
}