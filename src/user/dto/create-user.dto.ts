import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { EMAIL_LENGTH } from "src/constants/lengths";
import { EMAIL_REGEX } from "src/constants/regex";

export class CreateUserDto {
    @IsString()
    @MinLength(EMAIL_LENGTH.min)
    @MaxLength(EMAIL_LENGTH.max ?? 100)
    @IsEmail()
    @Matches(EMAIL_REGEX, {
        message: "Invalid email format"
    })
    email: string;
}
