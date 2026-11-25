import { IsValidName } from 'src/decorators/validators/name.decorator';

export class UpdateNameDto {
    @IsValidName()
    name: string;
}