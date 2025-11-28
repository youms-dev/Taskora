import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class PaginationDto {
    @IsString()
    @IsOptional()
    skip: string;

    @IsString()
    @IsOptional()
    take: string;
}