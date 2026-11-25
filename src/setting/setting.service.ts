import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from 'src/database/entities/setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
    constructor(@InjectRepository(Setting) private settingRepo: Repository<Setting>) { }

    async updateSetting() {
        
    }
}
