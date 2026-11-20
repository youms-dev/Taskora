import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class JwtAuthGard extends AuthGuard("jwt") {
    constructor(
        private readonly jwtService: JwtService,
        private readonly sessionService: SessionService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const req = context.switchToHttp().getRequest();
            const authorization = req.headers?.authorization;

            if (!authorization) {
                throw new UnauthorizedException("Missing token");
            }

            const token = (authorization as string).split(" ").pop();

            if (!token) {
                throw new UnauthorizedException("Missing token");
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.ACCESS_SECRET,
            });
            const session = await this.sessionService.getSessionByDevice(payload);

            req.user = session.user;

            return true;
        }
        catch (e) {
            throw new UnauthorizedException();
        }
    }
}
