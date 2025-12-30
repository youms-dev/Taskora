import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { supabaseAdmin } from 'src/lib/supabase';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  async create(datas: CreateUserDto) {
    const users = await this.supabaseList();

    if (users.length > 0) {
      const user = users.find((user) => user.email == datas.email);

      if (user) throw new ConflictException("This user already exists");
    }

    const user = await this.repo.findOne({
      where: {
        email: datas.email,
      }
    });

    if (user) throw new ConflictException("This user already exists");
    await this.repo.save(datas);

    return true;
  }

  async supabaseList() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw new Error("An error occurred");
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
