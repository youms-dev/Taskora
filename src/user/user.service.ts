import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  async create(datas: CreateUserDto) {
    return await this.repo.save(datas);
  }

  async findAll() {
    return await this.repo.find();
  }

  async findByEmail(email: string) {
    return await this.repo.findOne({
      where: {
        email
      }
    });
  }
}
