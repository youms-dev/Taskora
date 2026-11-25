import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createId } from '@paralleldrive/cuid2';
import * as Bcrypt from "bcryptjs";
import crypto from "crypto";
import { render } from 'react-email';
import CodeMail from 'src/components/code';
import MessageMail from 'src/components/message';
import { APP_NAME } from 'src/constants/names';
import { User } from 'src/database/entities/user.entity';
import { brevo } from 'src/lib/brevo';
import { redis } from 'src/lib/redis';
import { supabaseAdmin } from 'src/lib/supabase';
import { formatString, handleGreeting, randomNumber } from 'src/utils/tools';
import { Repository } from 'typeorm';
import { AddPasswordDto } from './dto/add-password.dto';
import { CheckCodeDto } from './dto/check-codel.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { UpdateNameDto } from './dto/update-name.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) { }

  async updatePhoto(req: any, file: any) {
    const user = req.user as User;

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

  async removePhoto(req: any) {
    const user = req.user as User;

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

  async updateName(req: any, data: UpdateNameDto) {
    const user = req.user as User;

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const name = formatString(data.name);

    await this.userRepo.save({
      ...user,
      name,
    });

    return true;
  }

  async sendCode(user: User) {
    const code = crypto.randomInt(0, 100000).toString().padStart(5, "0");

    await redis.set(`change-email-code:${user.email}`, code, {
      ex: 60 * 5,
    });

    const mail = await render(CodeMail({
      name: user.name,
      code,
      expireIn: 5,
    }));

    await brevo.transactionalEmails.sendTransacEmail({
      subject: user.setting.language == "fr" ? "Code de vérification." : "Verification code.",
      htmlContent: mail,
      sender: {
        name: APP_NAME,
        email: process.env.APP_EMAIL,
      },
      to: [
        {
          name: user.name,
          email: user.email,
        }
      ],
    });
  }

  async resendCode(req: any) {
    const user = req.user as User;

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const key = `change-email-attempts:${user.email}`;
    const attempts = await redis.get(key);

    if (attempts && Number(attempts) >= 5) {
      throw new HttpException("Too many attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.sendCode(user);

    return true;
  }

  async checkEmail(req: any, data: CheckEmailDto) {
    const user = req.user as User;

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const newEmail = data.email.toLowerCase().trim();
    const key = `change-email-attempts:${user.email}`;
    const attempts = await redis.incr(key);

    if (attempts == 1) {
      await redis.expire(key, 60 * (randomNumber(5, 10)));
    }
    else if (attempts >= 5) {
      throw new HttpException("Too many attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    const exists = await this.userRepo.findOne({
      where: {
        email: newEmail,
      }
    });

    if (exists) {
      throw new ConflictException("Email already taken!");
    }

    await this.sendCode(user);

    await redis.decr(key);

    return true;
  }

  async checkCode(req: any, data: CheckCodeDto) {
    const user = req.user as User;

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const newEmail = data.email.toLowerCase().trim();
    const code = data.code;
    const key = `change-email-attempts:${user.email}`;
    const codeKey = `change-email-code:${user.email}`;
    const attempts = await redis.incr(key);

    if (attempts == 1) {
      await redis.expire(key, 60 * (randomNumber(5, 10)));
    }
    else if (attempts >= 5) {
      throw new HttpException("Too many attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    const redisCode = await redis.get(codeKey);

    if (!redisCode) {
      throw new NotFoundException("Code expired!");
    }
    else if (redisCode != code) {
      throw new BadRequestException("Invalid code!");
    }

    if (data.provider) {
      await this.userRepo.save({
        ...user,
        email: newEmail,
        provider: data.provider,
        password: null,
      });

      await redis.del(key);
      await redis.del(codeKey);

      await this.sendMail(user);

      return {
        email: newEmail,
      }
    }
    else if (user.password) {
      await this.userRepo.save({
        ...user,
        email: newEmail,
        provider: null,
      });

      await redis.del(key);
      await redis.del(codeKey);

      await this.sendMail(user);

      return {
        email: newEmail,
      }
    }

    await redis.decr(key);

    return true;
  }

  async addPassword(req: any, data: AddPasswordDto) {
    const user = req.user as User;

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const newEmail = data.email.toLowerCase().trim();
    const key = `change-email-attempts:${user.email}`;
    const attempts = await redis.get(key);

    if (attempts && Number(attempts) >= 5) {
      throw new HttpException("Too many attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (user.password) {
      throw new ForbiddenException();
    }

    await this.userRepo.save({
      ...user,
      email: newEmail,
      provider: null,
      password: await Bcrypt.hash(data.password, 12),
    });

    await redis.del(key);
    await redis.del(`change-email-code:${user.email}`);

    await this.sendMail(user);

    return {
      email: newEmail,
    };
  }

  async sendMail(user: User) {
    const lng = user.setting.language == "fr" ? "fr" : "en";

    const mail = await render(MessageMail({
      language: lng,
      message: lng == "fr" ?
        [
          `${handleGreeting(lng)}${user.name ? ` ${user.name}` : ""};`,
          `L'adresse email associée à votre compte ${APP_NAME} vient juste d'être modifiée avec succès.`,
          `Continuez à profiter de ${APP_NAME} sans encombre.`,
        ]
        :
        [
          `${handleGreeting(lng)}${user.name ? ` ${user.name}` : ""};`,
          `The email address associated to your ${APP_NAME} account has just been successfully changed.`,
          `You can continue enjoying ${APP_NAME} without interruption.`,
        ]
    }));

    const r = await brevo.transactionalEmails.sendTransacEmail({
      subject: lng == "fr" ? `Adresse email modifiée` : `Email changed`,
      htmlContent: mail,
      sender: {
        name: APP_NAME,
        email: process.env.APP_EMAIL,
      },
      to: [
        {
          name: user.name,
          email: user.email,
        }
      ],
    });
  }
}