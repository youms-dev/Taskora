import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  create(@Body() datas: CreateUserDto) {
    return this.userService.create(datas);
  }

  @Post("list")
  findAll() {
    return this.userService.findAll();
  }
}
