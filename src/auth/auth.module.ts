import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from 'src/database/entities/session.entity';
import { Setting } from 'src/database/entities/setting.entity';
import { User } from 'src/database/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from 'src/session/session.service';
import { SessionModule } from 'src/session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Setting]),
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, SessionService],
  exports: [AuthService, JwtService, SessionService],
})
export class AuthModule { }
