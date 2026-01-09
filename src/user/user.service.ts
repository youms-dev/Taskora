import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { supabaseAdmin } from 'src/lib/supabase';
import { AuthUser } from "@supabase/supabase-js";

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  async create(datas: CreateUserDto) {
    const users = await this.supabaseList();
    const authUser = users.find((user: AuthUser) => user.email == datas.email);
    const ormUser = await this.repo.findOne({
      where: {
        email: datas.email,
      }
    });

    if (authUser || ormUser) throw new ConflictException("This user already exists");
    await this.repo.save(datas);

    return true;
  }

  async supabaseList() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw new InternalServerErrorException();
    else if (users.length == 0) throw new NotFoundException("No user found");

    return users;
  }

  async update(iduser: UpdateUserDto["iduser"], datas: Omit<UpdateUserDto, "iduser" | "email">) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(iduser, {
      user_metadata: {
        ...datas
      }
    });

    if (error) throw new NotFoundException("User not found or internal server error");
    return true;
  }
}
