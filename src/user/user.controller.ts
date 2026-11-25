import { Body, Controller, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';
import { AddPasswordDto } from './dto/add-password.dto';
import { CheckCodeDto } from './dto/check-codel.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { UpdateNameDto } from './dto/update-name.dto';
import { UserService } from './user.service';

@UseGuards(JwtAuthGard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Patch("update-photo")
  @UseInterceptors(FileInterceptor("file"))
  updatePhoto(@UploadedFile() file, @Req() req: any) {
    return this.userService.updatePhoto(req, file);
  }

  @Patch("remove-photo")
  removePhoto(@Req() req: any) {
    return this.userService.removePhoto(req);
  }

  @Patch("update-name")
  updateName(@Body() data: UpdateNameDto, @Req() req: any) {
    return this.userService.updateName(req, data);
  }

  @Post("change-email/check-email")
  checkEmail(@Body() data: CheckEmailDto, @Req() req: any) {
    return this.userService.checkEmail(req, data);
  }

  @Post("change-email/resend-code")
  resendCode(@Req() req: any) {
    return this.userService.resendCode(req);
  }

  @Patch("change-email/check-code")
  checkCode(@Body() data: CheckCodeDto, @Req() req: any) {
    return this.userService.checkCode(req, data);
  }

  @Patch("change-email/add-password")
  addPassword(@Body() data: AddPasswordDto, @Req() req: any) {
    return this.userService.addPassword(req, data);
  }
}
