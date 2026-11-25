import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from 'src/database/entities/session.entity';
import { User } from 'src/database/entities/user.entity';
import { AuthPayload } from 'src/types/auth';
import { Repository } from 'typeorm';
import { DeleteSessionDto } from './dto/delete.dto';

@Injectable()
export class SessionService {
    constructor(@InjectRepository(Session) private sessionRepo: Repository<Session>) { }

    async getSessionByDevice(data: AuthPayload) {
        const session = await this.sessionRepo.findOne({
            where: {
                idDevice: data.idDevice ?? "",
                user: {
                    idUser: data.sub ?? "",
                },
            },
            relations: {
                user: {
                    setting: true,
                },
            }
        });

        if (!session) {
            throw new NotFoundException("Session not found!");
        }

        return session;
    }

    async delete(req: any, data: DeleteSessionDto) {
        const user = req.user as User;

        if (!user) {
            throw new NotFoundException("User not found!");
        }

        const session = await this.sessionRepo.findOne({
            where: {
                idDevice: data.idDevice,
                user: {
                    idUser: user.idUser,
                },
            },
        });

        if (!session) {
            throw new NotFoundException("Session not found!");
        }

        await this.sessionRepo.delete({
            idSession: session.idSession,
        });

        return true;
    }
}
