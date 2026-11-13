import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Session } from 'src/database/entities/session.entity';
import { User } from 'src/database/entities/user.entity';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, JwtAuthGard],
  exports: [UserService],
})
export class UserModule { }
