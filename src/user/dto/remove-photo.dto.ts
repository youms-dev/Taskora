import { PickType } from '@nestjs/mapped-types';
import { UpdatePhotoDto } from './update-photo.dto';

export class RemovePhotoDto extends PickType(UpdatePhotoDto, ["email"]) { }