import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from 'src/database/entities/setting.entity';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
    constructor(@InjectRepository(Setting) private settingRepo: Repository<Setting>) { }

    async toggle2Fa(req: any) {
        const user = req.user as User;

        if (!user) {
            throw new NotFoundException("User not found!");
        }

        const setting = await this.settingRepo.findOne({
            where: {
                user: {
                    idUser: user.idUser,
                }
            },
        });

        if (!setting) {
            throw new InternalServerErrorException("An error occurred!");
        }

        await this.settingRepo.save({
            ...setting,
            _2FA: !setting._2FA,
        });

        return !setting._2FA;
    }
}
