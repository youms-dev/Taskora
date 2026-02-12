import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from "@supabase/supabase-js";
import { User } from 'src/entities/user.entity';
import { supabaseAdmin } from 'src/lib/supabase';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  async create(datas: CreateUserDto) {
    const users = await this.supabaseList();

    if (users.length > 0) {
      const authUser = users.find((user: AuthUser) => user.email == datas.email);
      const ormUser = await this.repo.findOne({
        where: {
          email: datas.email,
        }
      });

      if (authUser || ormUser) throw new ConflictException("This user already exists");
    }

    return this.repo.save(datas);
  }

  async supabaseList() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw new InternalServerErrorException();
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
