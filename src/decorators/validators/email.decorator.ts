import { applyDecorators } from "@nestjs/common";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { EMAIL_FORMAT_ERROR, EMAIL_LENGTH_ERROR } from "src/constants/errors";
import { EMAIL_REGEX } from "src/constants/regex";

export function IsValidEmail() {
    return applyDecorators(
        MinLength(8, {
            message: EMAIL_LENGTH_ERROR,
        }),
        MaxLength(100, {
            message: EMAIL_LENGTH_ERROR,
        }),
        IsString({
            message: "email must be a string!",
        }),
        Matches(EMAIL_REGEX, {
            message: EMAIL_FORMAT_ERROR,
        }),
        IsNotEmpty({
            message: "email cannot be empty!",
        }),
    );
}