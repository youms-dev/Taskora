import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createId } from '@paralleldrive/cuid2';
import { User } from 'src/database/entities/user.entity';
import { supabaseAdmin } from 'src/lib/supabase';
import { formatString } from 'src/utils/tools';
import { Repository } from 'typeorm';
import { RemovePhotoDto } from './dto/remove-photo.dto';
import { UpdateNameDto } from './dto/update-name.dto';
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
    const user = await this.userRepo.findOne({
      where: {
        idUser: data.idUser,
      }
    });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const fileName = createId() + Date.now();
    const fileExt = (file.mimetype as string).split("/").pop() ?? "png";
    const fullName = fileName + "." + fileExt;

    const { data: fileData, error } = (await supabaseAdmin
      .storage
      .from("files")
      .upload(fullName, file.buffer as any)
    );

    if (error) {
      throw new InternalServerErrorException("An error occurred!");
    }

    if (user.photo) {
      await supabaseAdmin
        .storage
        .from("files")
        .remove([user.photo]);
    }

    await this.userRepo.save({
      ...user,
      photo: fileData.path,
    });

    return fileData.path;
  }

  async removePhoto(data: RemovePhotoDto) {
    const user = await this.userRepo.findOne({
      where: {
        idUser: data.idUser,
      }
    });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    if (user.photo) {
      await supabaseAdmin
        .storage
        .from("files")
        .remove([user.photo]);
    }

    await this.userRepo.save({
      ...user,
      photo: null,
    });

    return true;
  }

  async updateName(data: UpdateNameDto) {
    const name = formatString(data.name);

    const user = await this.userRepo.findOne({
      where: {
        idUser: data.idUser,
      }
    });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    await this.userRepo.save({
      ...user,
      name,
    });

    return true;
  }
}
