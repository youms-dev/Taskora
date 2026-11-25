import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Setting } from 'src/database/entities/setting.entity';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Setting]),
  ],
  controllers: [SettingController],
  providers: [SettingService],
})
export class SettingModule { }
