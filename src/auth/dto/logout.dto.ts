import { IsString } from "class-validator";

export class LogoutDto {
    @IsString({
        message: "Device id must be a string",
    })
    idDevice: string;

    @IsString({
        message: "User id must be a string",
    })
    idUser: string;
}