import { Body, Controller, HttpCode, HttpStatus, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/auth/auth.guard';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("login")
  async login(@Body() datas: LoginDTO) {
    return this.authService.login(datas);
  }

  @Post("register")
  register(@Body() datas: RegisterDTO) {
    return this.authService.register(datas);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  @Post("session")
  session(@Req() req) {
    // return this.authService.session();
    return req.user;
  }
}
