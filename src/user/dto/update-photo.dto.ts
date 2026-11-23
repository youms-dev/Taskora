import { PickType } from '@nestjs/mapped-types';
import { LogoutDto } from 'src/auth/dto/logout.dto';

export class UpdatePhotoDto extends PickType(LogoutDto, ["idUser"]) { }