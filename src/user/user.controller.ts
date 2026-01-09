import { Controller, Post, Body, HttpStatus, HttpCode, Patch, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseAuthGuard } from 'src/guards/auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @HttpCode(HttpStatus.OK)
  @Post("/create")
  create(@Body() datas: CreateUserDto) {
    return this.userService.create(datas);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch("update/:id")
  complete(@Param("id") id: UpdateUserDto["iduser"], @Body() datas: Omit<UpdateUserDto, "iduser" | "email">) {
    return this.userService.update(id, datas);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("list")
  list() {
    return this.userService.supabaseList();
  }
}
