import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { PASSWORD_LENGTH_ERROR } from "src/constants/errors";
import { DEVICE_TYPE } from "src/database/entities/session.entity";
import { IsValidEmail } from "src/decorators/validators/email.decorator";

export class RegisterDto {
    @IsValidEmail()
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
    @IsNotEmpty({
        message: "password cannot be empty!",
    })
    password: string;

    @IsString({
        message: "The device name must be a string!",
    })
    @IsNotEmpty({
        message: "Device name cannot be empty!",
    })
    deviceName: string;

    @IsString({
        message: "The brand must be a string!",
    })
    @IsNotEmpty({
        message: "Device brand cannot be empty!",
    })
    deviceBrand: string;

    @IsEnum(DEVICE_TYPE, {
        message: "Invalid device type!",
    })
    @IsNotEmpty({
        message: "Device type cannot be empty!",
    })
    deviceType: DEVICE_TYPE;

    @IsNotEmpty({
        message: "Device modal can't be empty!",
    })
    @IsString({
        message: "Device model is a string!",
    })
    deviceModel: string;

    @IsOptional()
    @IsString({
        message: "Photo must be a string!",
    })
    photo?: string;
}