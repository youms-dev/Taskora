import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { supabase } from 'src/lib/supabase';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers?.authorization as string | undefined;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException();
        }

        const token = authHeader.split(" ").pop();
        if (!token) throw new UnauthorizedException();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new UnauthorizedException();
        }
        req.user = user as User;

        return true;
    }
}
