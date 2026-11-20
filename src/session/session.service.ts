import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from 'src/database/entities/session.entity';
import { AuthPayload } from 'src/types/auth';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService {
    constructor(@InjectRepository(Session) private sessionRepo: Repository<Session>) { }

    async getSessionByDevice(data: AuthPayload) {
        const session = await this.sessionRepo.findOne({
            where: {
                idDevice: data.idDevice ?? "",
                user: {
                    idUser: data.id ?? "",
                }
            },
            relations: {
                user: true,
            }
        });

        if (!session) {
            throw new NotFoundException("Session not found!");
        }

        return session;
    }
}
