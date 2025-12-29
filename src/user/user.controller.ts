import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { SupabaseAuthGuard } from 'src/guards/auth/auth.guard';
import { OnboardingDto } from './dto/onboarding.dto';
import { CreateUserDto } from './dto/create-user.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }
  
  @Post("/create")
  create(@Body() datas: CreateUserDto) {
    return this.userService.create(datas);
  }
  
  @HttpCode(HttpStatus.OK)
  @Post("onboarding")
  complete(@Body() datas: OnboardingDto) {
    return this.userService.complete(datas);
  }
}
