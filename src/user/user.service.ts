import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { supabase, supabaseAdmin } from 'src/lib/supabase';
import { Repository } from 'typeorm';
import { UpdatePhotoDto } from './dto/update-photo.dto';

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

  async updatePhoto(data: UpdatePhotoDto, file: any) {
    const email = data.email.toLowerCase().trim();

    const user = await this.userRepo.findOne({
      where: {
        email,
      }
    });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const { data: fileData, error } = await supabaseAdmin.storage
      .from("files")
      .upload(file.originalname, file.buffer as any);

    if (error) {
      console.log(error);
      throw new InternalServerErrorException("An error occurred!");
    }

    return fileData;
  }
}
