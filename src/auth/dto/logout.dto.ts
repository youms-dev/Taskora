import { IsNotEmpty, IsString } from "class-validator";

export class LogoutDto {
    @IsString({
        message: "Device id must be a string",
    })
    @IsNotEmpty({
        message: "Device id cannot be empty",
    })
    idDevice: string;

    @IsString({
        message: "User id must be a string",
    })
    @IsNotEmpty({
        message: "User id cannot be empty!",
    })
    idUser: string;
}