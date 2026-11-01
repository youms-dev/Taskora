import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @HttpCode(HttpStatus.OK)
  @Post("create")
  create(@Body() datas: CreateUserDto) {
    return this.userService.create(datas);
  }

  // @UseGuards(SupabaseAuthGuard)
  @Patch("update/:id")
  complete(@Param("id") id: UpdateUserDto["iduser"], @Body() datas: Omit<UpdateUserDto, "iduser" | "email">) {
    return this.userService.update(id, datas);
  }

  @Get("list")
  greeting() {
    return "Liste des utilisateurs";
  }
}
