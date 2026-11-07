import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createId } from '@paralleldrive/cuid2';
import { compare, hash } from 'bcryptjs';
import { Session } from 'src/database/entities/session.entity';
import { Setting } from 'src/database/entities/setting.entity';
import { User } from 'src/database/entities/user.entity';
import { formatString } from 'src/utils/tools';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { OAuthRegisterDto } from './dto/oauth-register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { OAuthLoginDto } from './dto/oaut-login.dto';

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

        const user = await this.userRepo.findOne({
            where: {
                email,
            }
        });

        if (user) {
            throw new ConflictException("Email already taken!");
        }

        const setting = await this.settingRepo.save({});
        const password = await hash(data.password, 12);

        const newUser = await this.userRepo.save({
            email,
            password,
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

        const idDevice = createId();
        const brand = formatString(data.deviceBrand);
        const deviceName = formatString(data.deviceName);

        await this.sessionRepo.save({
            user: newUser,
            idDevice,
            deviceName,
            refreshToken,
            brand,
            type: data.deviceType,
        });

        return {
            accessToken,
            refreshToken,
            idDevice,
            email: newUser.email,
        };
    }

    async oAuthRegister(data: OAuthRegisterDto) {
        const email = data.email.toLocaleLowerCase().trim();

        const user = await this.userRepo.findOne({
            where: {
                email,
            }
        });

        if (user) {
            throw new ConflictException("Email already taken!");
        }

        const setting = await this.settingRepo.save({});

        const newUser = await this.userRepo.save({
            email,
            setting,
            photo: data.photo ?? undefined,
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

        const idDevice = createId();
        const brand = formatString(data.deviceBrand);
        const deviceName = formatString(data.deviceName);

        await this.sessionRepo.save({
            user: newUser,
            idDevice,
            deviceName,
            refreshToken,
            brand,
            type: data.deviceType,
            provider: data.provider,
        });

        return {
            accessToken,
            refreshToken,
            idDevice,
            email: newUser.email,
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
            throw new NotFoundException("Invalid credentials!");
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

        if (data.idDevice) {
            const session = await this.sessionRepo.findOne({
                where: {
                    user: {
                        email: user.email,
                    },
                    idDevice: data.idDevice,
                }
            });

            if (session) {
                await this.sessionRepo.save({
                    ...session,
                    refreshToken,
                });

                return {
                    accessToken,
                    refreshToken,
                    idDevice: data.idDevice,
                    email: user.email,
                };
            }
            else {
                const idDevice = createId();
                const deviceName = formatString(data.deviceName);
                const brand = formatString(data.deviceBrand);

                await this.sessionRepo.save({
                    user,
                    idDevice,
                    deviceName,
                    refreshToken,
                    brand,
                    type: data.deviceType,
                });

                return {
                    accessToken,
                    refreshToken,
                    idDevice,
                    email: user.email,
                };
            }
        }
        else {
            const idDevice = createId();
            const deviceName = formatString(data.deviceName);
            const brand = formatString(data.deviceBrand);

            await this.sessionRepo.save({
                user,
                idDevice,
                deviceName,
                refreshToken,
                brand,
                type: data.deviceType,
            });

            return {
                accessToken,
                refreshToken,
                idDevice,
                email: user.email,
            };
        }
    }

    async oAuthLogin(data: OAuthLoginDto) {
        const email = data.email.toLocaleLowerCase().trim();

        const user = await this.userRepo.findOne({
            where: {
                email,
            },
        })

        if (!user) {
            throw new NotFoundException("Account not found!");
        }

        const setting = await this.settingRepo.findOne({
            where: {
                user: {
                    idUser: user.idUser,
                }
            }
        });

        if (!setting) {
            throw new InternalServerErrorException("An error occurred!");
        }

        if (setting._2FA) {
            return {
                _2FA: true,
            }
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

        if (data.idDevice) {
            const session = await this.sessionRepo.findOne({
                where: {
                    user: {
                        email: user.email,
                    },
                    idDevice: data.idDevice,
                }
            });

            if (session) {
                await this.sessionRepo.save({
                    ...session,
                    refreshToken,
                });

                return {
                    accessToken,
                    refreshToken,
                    idDevice: data.idDevice,
                    email: user.email,
                };
            }
            else {
                const idDevice = createId();
                const deviceName = formatString(data.deviceName);
                const brand = formatString(data.deviceBrand);

                await this.sessionRepo.save({
                    user,
                    idDevice,
                    deviceName,
                    refreshToken,
                    brand,
                    type: data.deviceType,
                    provider: data.provider,
                });
                
                return {
                    accessToken,
                    refreshToken,
                    idDevice,
                    email: user.email,
                };
            }
        }
        else {
            const idDevice = createId();
            const deviceName = formatString(data.deviceName);
            const brand = formatString(data.deviceBrand);

            await this.sessionRepo.save({
                user,
                idDevice,
                deviceName,
                refreshToken,
                brand,
                type: data.deviceType,
                provider: data.provider,
            });

            return {
                accessToken,
                refreshToken,
                idDevice,
                email: user.email,
            };
        }
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
