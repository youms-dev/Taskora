import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from 'src/database/entities/session.entity';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
  ],
  controllers: [SessionController],
  providers: [SessionService, JwtAuthGard, JwtStrategy, JwtService],
  exports: [SessionService],
})
export class SessionModule { }
