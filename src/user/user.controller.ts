import { Body, Controller, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResendCodeDto } from 'src/auth/dto/resend-code.dto';
import { AddPasswordDto } from './dto/add-password.dto';
import { CheckCodeDto } from './dto/check-codel.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { RemovePhotoDto } from './dto/remove-photo.dto';
import { UpdateNameDto } from './dto/update-name.dto';
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

  @Patch("update-name")
  updateName(@Body() data: UpdateNameDto) {
    return this.userService.updateName(data);
  }

  @Post("change-email/check-email")
  checkEmail(@Body() data: CheckEmailDto) {
    return this.userService.checkEmail(data);
  }

  @Post("change-email/resend-code")
  sendCode(@Body() data: ResendCodeDto) {
    return this.userService.resendCode(data);
  }

  @Patch("change-email/check-code")
  checkCode(@Body() data: CheckCodeDto) {
    return this.userService.checkCode(data);
  }

  @Patch("change-email/add-password")
  addPassword(@Body() data: AddPasswordDto) {
    return this.userService.addPassword(data);
  }
}
