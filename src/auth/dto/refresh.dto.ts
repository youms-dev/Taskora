import { IsString } from "class-validator";

export class RefreshDto {
    @IsString({
        message: "Invalid token!",
    })
    accessToken: string;

    @IsString({
        message: "Invalid token!",
    })
    refreshToken: string;
}