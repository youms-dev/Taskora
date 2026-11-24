import { IsNotEmpty, IsString } from "class-validator";

export class RefreshDto {
    @IsString({
        message: "Invalid token!",
    })
    @IsNotEmpty({
        message: "token cannot be empty!",
    })
    refreshToken: string;
}