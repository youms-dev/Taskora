import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) { }

  async getUser(email: string) {
    const emailFormatted = email.toLowerCase().trim();

    const user = await this.userRepo.findOne({
      where: {
        email: emailFormatted,
      }
    });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    return user;
  }
}
