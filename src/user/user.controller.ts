import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post("update-photo")
  @UseInterceptors(FileInterceptor("file"))
  updatePhoto(@UploadedFile() file, @Body() data: UpdatePhotoDto) {
    return this.userService.updatePhoto(data, file);
  }
}
