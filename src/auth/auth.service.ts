import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createId } from '@paralleldrive/cuid2';
import * as Bcrypt from "bcryptjs";
import crypto from "crypto";
import { render } from 'react-email';
import CodeMail from 'src/components/code';
import MessageMail from 'src/components/message';
import { APP_NAME } from 'src/constants/names';
import { Session } from 'src/database/entities/session.entity';
import { Setting } from 'src/database/entities/setting.entity';
import { User } from 'src/database/entities/user.entity';
import { brevo } from 'src/lib/brevo';
import { redis } from 'src/lib/redis';
import { AuthPayload } from 'src/types/auth';
import { formatString, handleGreeting, randomNumber } from 'src/utils/tools';
import { Repository } from 'typeorm';
import { _2FADto } from './dto/_2fa.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { OAuthLoginDto } from './dto/oaut-login.dto';
import { OAuthRegisterDto } from './dto/oauth-register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    private registerMessageTab = [
        `Hi there ;`,
        `Welcome to ${APP_NAME}.`,
        `Your ${APP_NAME} account has been created successfully.`,
        "Manage your tasks and other activities in the easiest way possible.",
        "Remember to go to the app settings to customize your experience.",
    ];

    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
        @InjectRepository(Setting) private readonly settingRepo: Repository<Setting>,
        private readonly jwtService: JwtService,
    ) { }

    async register(data: RegisterDto) {
        const email = data.email.toLowerCase().trim();

        const user = await this.userRepo.findOne({
            where: {
                email,
            }
        });

        if (user) {
            throw new ConflictException("Email already taken!");
        }

        const setting = await this.settingRepo.save({});
        const password = await Bcrypt.hash(data.password, 12);

        const newUser = await this.userRepo.save({
            email,
            password,
            setting,
        });

        const idDevice = createId();
        const brand = formatString(data.deviceBrand);
        const deviceName = formatString(data.deviceName);
        const payload: AuthPayload = {
            sub: newUser.idUser,
            idDevice,
        }

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: "15m",
            secret: process.env.ACCESS_SECRET,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: "30d",
            secret: process.env.REFRESH_SECRET,
        });

        await this.sessionRepo.save({
            user: newUser,
            idDevice,
            deviceName,
            refreshToken,
            deviceBrand: brand,
            deviceType: data.deviceType,
        });

        const mail = await render(MessageMail({
            message: this.registerMessageTab,
        }));

        await brevo.transactionalEmails.sendTransacEmail({
            subject: `Welcome to ${APP_NAME}`,
            htmlContent: mail,
            sender: {
                name: APP_NAME,
                email: process.env.APP_EMAIL,
            },
            to: [
                {
                    name: newUser.name,
                    email: newUser.email,
                }
            ],
        });

        return {
            accessToken,
            refreshToken,
            idDevice,
            user: {
                id: newUser.idUser,
                email: newUser.email,
                photo: newUser.photo,
            }
        };
    }

    async oAuthRegister(data: OAuthRegisterDto) {
        const email = data.email.toLowerCase().trim();

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
            provider: data.provider,
        });

        const idDevice = createId();
        const brand = formatString(data.deviceBrand);
        const deviceName = formatString(data.deviceName);
        const payload: AuthPayload = {
            sub: newUser.idUser,
            idDevice,
        }

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: "15m",
            secret: process.env.ACCESS_SECRET,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: "30d",
            secret: process.env.REFRESH_SECRET,
        });

        await this.sessionRepo.save({
            user: newUser,
            idDevice,
            deviceName,
            refreshToken,
            deviceBrand: brand,
            deviceType: data.deviceType,
        });

        const mail = await render(MessageMail({
            message: this.registerMessageTab,
        }));

        await brevo.transactionalEmails.sendTransacEmail({
            subject: `Welcome to ${APP_NAME}`,
            htmlContent: mail,
            sender: {
                name: APP_NAME,
                email: process.env.APP_EMAIL,
            },
            to: [
                {
                    name: newUser.name,
                    email: newUser.email,
                }
            ],
        });

        return {
            accessToken,
            refreshToken,
            idDevice,
            user: {
                id: newUser.idUser,
                email: newUser.email,
                photo: newUser.photo,
            }
        };
    }

    async handleSession(user: User, data: Omit<LoginDto, "password">) {
        const session = (data.idDevice ?
            await this.sessionRepo.findOne({
                where: {
                    user: {
                        email: user.email,
                    },
                    idDevice: data.idDevice,
                }
            })
            :
            null
        );

        if (data.idDevice && session) {
            const payload: AuthPayload = {
                sub: user.idUser,
                idDevice: data.idDevice,
            }

            const accessToken = await this.jwtService.signAsync(payload, {
                expiresIn: "15m",
                secret: process.env.ACCESS_SECRET,
            });

            const refreshToken = await this.jwtService.signAsync(payload, {
                expiresIn: "30d",
                secret: process.env.REFRESH_SECRET,
            });

            await this.sessionRepo.save({
                ...session,
                refreshToken,
            });

            return {
                accessToken,
                refreshToken,
                idDevice: data.idDevice,
                user: {
                    id: user.idUser,
                    email: user.email,
                    photo: user.photo,
                }
            };
        }

        const idDevice = createId();
        const deviceName = formatString(data.deviceName);
        const brand = formatString(data.deviceBrand);
        const payload: AuthPayload = {
            sub: user.idUser,
            idDevice,
        }

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: "15m",
            secret: process.env.ACCESS_SECRET,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: "30d",
            secret: process.env.REFRESH_SECRET,
        });

        await this.sessionRepo.save({
            user,
            idDevice,
            deviceName,
            refreshToken,
            deviceBrand: brand,
            deviceType: data.deviceType,
        });

        return {
            accessToken,
            refreshToken,
            idDevice,
            user: {
                id: user.idUser,
                email: user.email,
                photo: user.photo,
            }
        };
    }

    async sendLoginMail(user: User) {
        const lng = user.setting.language == "fr" ? "fr" : "en";

        const mail = await render(MessageMail({
            language: lng,
            message: lng == "fr" ?
                [
                    `${handleGreeting(lng)}${user.name ? ` ${user.name}` : ""};`,
                    `Une nouvelle connexion à votre compte ${APP_NAME} vient d'être effectuée.`,
                    `Si ce n'était pas vous, nous vous recommandons de modifier votre mot de passe impérativement !`,
                ]
                :
                [
                    `${handleGreeting(lng)}${user.name ? ` ${user.name}` : ""};`,
                    `Someone just signed in to your ${APP_NAME} account.`,
                    `If this wasn't you, we strongly recommend changing your password immediately.`,
                ]
        }));

        await brevo.transactionalEmails.sendTransacEmail({
            subject: lng == "fr" ? `Connexion à ${APP_NAME}` : `Sign in to ${APP_NAME}`,
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

    async login(data: LoginDto) {
        const email = data.email.toLowerCase().trim();
        const key = `login-attempts:${email}`;
        const attempts = await redis.incr(key);

        if (attempts == 1) {
            await redis.expire(key, randomNumber(5, 10) * 60);
        }
        else if (attempts > 5) {
            throw new HttpException("Too many requests!", HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.userRepo.findOne({
            where: {
                email,
            },
            relations: {
                setting: true,
            }
        });

        if (!user) {
            throw new NotFoundException("Invalid credentials!");
        }

        if (!user.password) {
            await redis.decr(key);

            return {
                password: false,
            }
        }

        const matches = await Bcrypt.compare(data.password, user.password);

        if (!matches) {
            throw new NotFoundException("Invalid credentials!");
        }

        if (user.setting._2FA) {
            await this.sendCode(user.email);
            await redis.decr(key);

            return {
                _2FA: true,
            }
        }

        await redis.del(key);

        await this.sendLoginMail(user);

        const { password, ...rest } = data;

        return await this.handleSession(user, { ...rest });
    }

    async oAuthLogin(data: OAuthLoginDto) {
        const email = data.email.toLowerCase().trim();
        const key = `login-attempts:${email}`;
        const attempts = await redis.incr(key);

        if (attempts == 1) {
            await redis.expire(key, randomNumber(5, 10) * 60);
        }
        else if (attempts > 5) {
            throw new HttpException("Too many requests!", HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.userRepo.findOne({
            where: {
                email,
            },
            relations: {
                setting: true,
            }
        });

        if (!user) {
            throw new NotFoundException("Account not found!");
        }

        if (user.password) {
            await redis.decr(key);

            return {
                password: true,
            }
        }

        if (user.setting._2FA) {
            await this.sendCode(user.email);
            await redis.decr(key);

            return {
                _2FA: true,
            }
        }

        await redis.del(key);

        await this.sendLoginMail(user);

        const { provider, ...rest } = data;

        return await this.handleSession(user, { ...rest });
    }

    async checkCode(data: _2FADto) {
        const email = data.email.toLowerCase();
        const attemptsKey = `login-attempts:${email}`;
        const attempts = await redis.incr(attemptsKey);

        if (attempts == 1) {
            await redis.expire(attemptsKey, randomNumber(5, 10) * 60);
        }
        else if (attempts > 5) {
            throw new HttpException("Too many requests!", HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.userRepo.findOne({
            where: {
                email,
            },
        });

        if (!user) {
            throw new NotFoundException("Account not found!");
        }

        const key = `_2FA-code:${email}`;
        const redisCode = await redis.get(key);

        if (!redisCode) {
            throw new NotFoundException("The code has expired!");
        }
        else if (redisCode != data.code) {
            throw new BadRequestException("Invalid code!");
        }

        await redis.del(key);
        await redis.del(attemptsKey);

        const { code, ...rest } = data;

        return await this.handleSession(user, { ...rest });
    }

    async sendCode(email: string) {
        const emailFormatted = email.toLowerCase().trim();
        const key = `login-attempts:${email}`;
        const attempts = await redis.incr(key);

        if (attempts == 1) {
            await redis.expire(key, randomNumber(5, 10) * 60);
        }
        else if (attempts > 5) {
            throw new HttpException("Too many requests!", HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.userRepo.findOne({
            where: {
                email: emailFormatted,
            },
            relations: {
                setting: true,
            },
        });

        if (!user) {
            throw new NotFoundException("Account not found!");
        }

        const code = crypto.randomInt(0, 100000).toString().padStart(5, "0");

        await redis.set(`_2FA-code:${user.email}`, code, {
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

    async refresh(data: RefreshDto) {
        try {
            const payload: AuthPayload = await this.jwtService.verifyAsync(data.refreshToken, {
                secret: process.env.REFRESH_SECRET,
            });

            const session = await this.sessionRepo.findOneBy({
                user: {
                    idUser: payload.sub ?? "",
                },
                idDevice: payload.idDevice ?? "",
                refreshToken: data.refreshToken,
            });

            if (!session) {
                throw new NotFoundException("Session not found!");
            }

            const newPayload = {
                id: payload.sub,
                idDevice: payload.idDevice,
            }

            const accessToken = await this.jwtService.signAsync(newPayload, {
                secret: process.env.ACCESS_SECRET,
                expiresIn: "15m",
            });

            const refreshToken = await this.jwtService.signAsync(newPayload, {
                secret: process.env.REFRESH_SECRET,
                expiresIn: "30d",
            });

            await this.sessionRepo.save({
                ...session,
                refreshToken,
            });

            return {
                accessToken,
                refreshToken,
            };
        }
        catch (e) {
            throw new UnauthorizedException("Invalid token");
        }
    }

    async logout(data: LogoutDto) {
        const session = await this.sessionRepo.findOneBy({
            user: {
                idUser: data.idUser,
            },
            idDevice: data.idDevice,
        });

        if (!session) {
            throw new NotFoundException("Session not found!");
        }

        await this.sessionRepo.save({
            ...session,
            refreshToken: null,
        });

        return true;
    }
}
