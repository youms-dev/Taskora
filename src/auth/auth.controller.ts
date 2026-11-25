import { Body, Controller, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { _2FADto } from './dto/_2fa.dto';
import { CheckCodeDto } from './dto/check-code.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { OAuthLoginDto } from './dto/oaut-login.dto';
import { OAuthRegisterDto } from './dto/oauth-register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  @Post("refresh")
  refresh(@Body() data: RefreshDto) {
    return this.authService.refresh(data);
  }

  @Post("logout")
  logout(@Body() data: LogoutDto) {
    return this.authService.logout(data);
  }

  @Post("reset-password/check-email")
  checkResetEmail(@Body() data: CheckEmailDto) {
    return this.authService.checkEmail(data);
  }

  @Post("reset-password/check-code")
  checkResetCode(@Body() data: CheckCodeDto) {
    return this.authService.checkResetCode(data);
  }

  @Post("reset-password/resend-code")
  resendRestCode(@Body() data: ResendCodeDto) {
    return this.authService.sendResetCode(data.email);
  }

  @Patch("reset-password")
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }
}
