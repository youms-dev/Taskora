import { PickType } from '@nestjs/mapped-types';
import { LoginDto } from "src/auth/dto/login.dto";

export class UpdatePhotoDto extends PickType(LoginDto, ["email"]) { }