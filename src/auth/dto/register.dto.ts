import { IsString, Matches } from "class-validator";
import { EMAIL_REGEX } from "src/constants/regex";

export class RegisterDto {
    @IsString({
        message: "email must be a string!",
    })
    @Matches(EMAIL_REGEX, {
        message: "Invalid email format !",
    })
    email: string;

    @IsString({
        message: "password must be a string!",
    })
    password: string;

    @IsString({
        message: "Device is required!",
    })
    device: string;
}