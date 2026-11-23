import { PickType } from '@nestjs/mapped-types';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { NAME_FORMAT_ERROR, NAME_LENGTH_ERROR } from 'src/constants/errors';
import { NAME_REGEX } from 'src/constants/regex';
import { UpdatePhotoDto } from './update-photo.dto';

export class UpdateNameDto extends PickType(UpdatePhotoDto, ["idUser"]) {
    @IsString({
        message: "name must be a string",
    })
    @MinLength(3, {
        message: NAME_LENGTH_ERROR,
    })
    @MaxLength(100, {
        message: NAME_LENGTH_ERROR,
    })
    @Matches(NAME_REGEX, {
        message: NAME_FORMAT_ERROR,
    })
    name: string;
}