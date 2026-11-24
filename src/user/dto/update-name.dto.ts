import { PickType } from '@nestjs/mapped-types';
import { IsValidName } from 'src/decorators/validators/name.decorator';
import { UpdatePhotoDto } from './update-photo.dto';

export class UpdateNameDto extends PickType(UpdatePhotoDto, ["idUser"]) {
    @IsValidName()
    name: string;
}