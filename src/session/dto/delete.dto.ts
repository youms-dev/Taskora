import { IsNotEmpty, IsString } from "class-validator";

export class DeleteSessionDto {
    @IsString({
        message: "Device id is supposed to be a string!",
    })
    @IsNotEmpty({
        message: "Device id can't be empty!",
    })
    idDevice: string;
}