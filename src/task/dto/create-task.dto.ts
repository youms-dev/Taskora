import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTaskDto {
    @IsString({
        message: "Le contenu doit être de type String !"
    })
    @MinLength(3, {
        message: "Le contenu doit comporter minimum 3 caractères !"
    })
    content: string;

    @IsBoolean({
        message: "'Done' doit être de type Boolean !"
    })
    @IsOptional()
    done: boolean;
}