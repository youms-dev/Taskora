import { Body, Controller, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RemovePhotoDto } from './dto/remove-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { UserService } from './user.service';

// @UseGuards(JwtAuthGard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Patch("update-photo")
  @UseInterceptors(FileInterceptor("file"))
  updatePhoto(@UploadedFile() file, @Body() data: UpdatePhotoDto) {
    return this.userService.updatePhoto(data, file);
  }

  @Patch("remove-photo")
  removePhoto(@Body() data: RemovePhotoDto) {
    return this.userService.removePhoto(data);
  }
}
