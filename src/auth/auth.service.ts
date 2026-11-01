import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Session } from 'src/database/entities/session.entity';
import { Setting } from 'src/database/entities/setting.entity';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
        @InjectRepository(Setting) private readonly settingRepo: Repository<Setting>,
        private readonly jwtService: JwtService,
    ) { }

    async register(data: RegisterDto) {
        const email = data.email.toLocaleLowerCase().trim();
        const device = (data.device.toLocaleLowerCase().split(" ")
            .map(l => l.charAt(0).toUpperCase() + l.slice(1))
            .join(" ")
        );

        const user = await this.userRepo.findOne({
            where: {
                email,
            }
        })

        if (user) {
            throw new ConflictException("Email already taken");
        }

        const setting = await this.settingRepo.save({});

        const newUser = await this.userRepo.save({
            email,
            password: await hash(data.password, 12),
            setting,
        });

        const accessToken = await this.jwtService.signAsync({
            email,
        }, {
            expiresIn: "15m",
            secret: process.env.ACCESS_SECRET,
        });

        const refreshToken = await this.jwtService.signAsync({
            email,
        }, {
            expiresIn: "30d",
            secret: process.env.REFRESH_SECRET,
        });

        await this.sessionRepo.save({
            user: newUser,
            device,
            refreshToken,
        });

        await this.sessionRepo.save({
            user: newUser,
            device,
            refreshToken,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async login(data: LoginDto) {
        const email = data.email.toLocaleLowerCase().trim();

        const user = await this.userRepo.findOne({
            where: {
                email,
            },
        })

        const matches = await compare(data.password, user?.password ?? "");

        if (!matches || !user) {
            throw new BadRequestException("Invalid credentials!");
        }

        const accessToken = await this.jwtService.signAsync({
            email,
            sub: email,
        }, {
            expiresIn: "15m",
            secret: process.env.ACCESS_SECRET,
        });

        const refreshToken = await this.jwtService.signAsync({
            email,
            sub: email,
        }, {
            expiresIn: "30d",
            secret: process.env.REFRESH_SECRET,
        });

        const sessions = await this.sessionRepo.find({
            where: {
                user: {
                    email: user.email,
                }
            }
        });

        await Promise.all(sessions.map(async (session) => {
            await this.sessionRepo.save({
                ...session,
                refreshToken,
            });
        }));

        return {
            accessToken,
            refreshToken,
        };
    }

    async validate(email: string) {
        const emailFormatted = email.toLocaleLowerCase().trim();

        const user = await this.userRepo.findOne({
            where: {
                email: emailFormatted,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found!");
        }

        return true;
    }

    async refresh(data: RefreshDto) {
        try {

            const validRefreshToken = await this.jwtService.verifyAsync(data.refreshToken, {
                secret: process.env.REFRESH_SECRET,
            });

            let email: string = validRefreshToken.email;

            const session = await this.sessionRepo.findOneBy({
                user: {
                    email,
                },
                refreshToken: data.refreshToken,
            });

            if (!session) {
                throw new NotFoundException("Session not found!");
            }

            const accessToken = await this.jwtService.signAsync({
                email,
            }, {
                secret: process.env.ACCESS_SECRET,
                expiresIn: "15m",
            });

            const refreshToken = await this.jwtService.signAsync({
                email,
            }, {
                secret: process.env.REFRESH_SECRET,
                expiresIn: "30d",
            });

            await this.sessionRepo.update(
                {
                    idSession: session.idSession,
                },
                {
                    refreshToken,
                },
            );

            return {
                accessToken,
                refreshToken,
            };
        }
        catch (e) {
            throw new BadRequestException("Invalid token");
        }
    }
}
