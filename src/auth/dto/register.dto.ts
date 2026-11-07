import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { EMAIL_FORMAT_ERROR, EMAIL_LENGTH_ERROR, PASSWORD_LENGTH_ERROR } from "src/constants/errors";
import { EMAIL_REGEX } from "src/constants/regex";
import { DEVICE_TYPE } from "src/database/entities/session.entity";

export class RegisterDto {
    @MinLength(8, {
        message: EMAIL_LENGTH_ERROR,
    })
    @MaxLength(100, {
        message: EMAIL_LENGTH_ERROR,
    })
    @IsString({
        message: "email must be a string!",
    })
    @Matches(EMAIL_REGEX, {
        message: EMAIL_FORMAT_ERROR,
    })
    email: string;

    @MinLength(8, {
        message: PASSWORD_LENGTH_ERROR,
    })
    @MaxLength(100, {
        message: PASSWORD_LENGTH_ERROR,
    })
    @IsString({
        message: "password must be a string!",
    })
    password: string;

    @IsString({
        message: "The device name must be a string!",
    })
    deviceName: string;

    @IsString({
        message: "The brand must be a string!",
    })
    deviceBrand: string;

    @IsEnum(DEVICE_TYPE, {
        message: "Invalid device type!",
    })
    deviceType: DEVICE_TYPE;

    @IsOptional()
    @IsString({
        message: "Photo must be a string!",
    })
    photo?: string;
}