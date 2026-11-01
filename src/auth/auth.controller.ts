import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("register")
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post("login")
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @UseGuards(JwtAuthGard)
  @Post("test")
  test(@Body() data: RefreshDto) {
    return this.authService.refresh(data);
  }
}
