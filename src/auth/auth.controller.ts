import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OAuthLoginDto } from './dto/oaut-login.dto';
import { OAuthRegisterDto } from './dto/oauth-register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { _2FADto } from './dto/2fa.dto';
import { hash } from 'bcryptjs';
import { ResendCodeDto } from './dto/resend-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("register")
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post("oauth-register")
  oAuthRegister(@Body() data: OAuthRegisterDto) {
    return this.authService.oAuthRegister(data);
  }

  @Post("login")
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post("oauth-login")
  oAuthLogin(@Body() data: OAuthLoginDto) {
    return this.authService.oAuthLogin(data);
  }

  @Post("login/2fa/check-code")
  checkCode(@Body() data: _2FADto) {
    return this.authService.checkCode(data);
  }

  @Post("login/2fa/resend-code")
  resendCode(@Body() data: ResendCodeDto) {
    return this.authService.sendCode(data.email);
  }

  @UseGuards(JwtAuthGard)
  @Post("test")
  test(@Body() data: RefreshDto) {
    return this.authService.refresh(data);
  }
}
