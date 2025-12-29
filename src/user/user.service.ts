import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { OnboardingDto } from './dto/onboarding.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  async complete(datas: OnboardingDto) {
    const user = await this.repo.findOne({
      where: {
        email: datas.email
      }
    });

    if (!user) {
      throw new NotFoundException();
    }

    await this.repo.update({
      iduser: user.iduser
    }, {
      name: datas.name,
      photoUrl: datas.photoUrl,
      onBoardingComplete: true,
    })
    return true;
  }

  async create(datas: CreateUserDto) {
    const user = await this.repo.findOne({
      where: {
        email: datas.email,
      }
    });

    if (user) throw new ConflictException("This user already exists");
    await this.repo.save(datas);

    return true;
  }
}
