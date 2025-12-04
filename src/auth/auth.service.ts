import { Injectable, UnauthorizedException } from '@nestjs/common';
import supabase from 'src/lib/supabase';
import { UserService } from 'src/user/user.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private userService: UserService) { }

    async login(datas: LoginDTO) {
        const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email: datas.email,
            password: datas.password,
        });
        if (error || !session) throw new UnauthorizedException(error?.message || 'Session not found');

        return { session };
    }

    async register(datas: RegisterDTO) {
        const { data, error } = await supabase.auth.signUp({
            email: datas.email,
            password: datas.password,
            options: {
                data: {
                    name: datas.name,
                }
            }
        });
        if (error) throw new UnauthorizedException(error.message);
        return data.user;
    }

    async session() {
        const { data: { user }, error } = await supabase.auth.getUser("eyJhbGciOiJIUzI1NiIsImtpZCI6IjlDVEc0bGFrcitySHVOeGUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2JocnFuc2VhZ3Z6dGZlZHJodWhqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhZTc0MWI2Zi0zYWEyLTRiMjYtYWNiYS0zNTliNWQ0NWVhODciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0Njg3NzgwLCJpYXQiOjE3NjQ2ODQxODAsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiWW91bXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImFlNzQxYjZmLTNhYTItNGIyNi1hY2JhLTM1OWI1ZDQ1ZWE4NyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY0Njg0MTgwfV0sInNlc3Npb25faWQiOiJjZmRmNGQwMC1iOTI2LTQzZDItYWQ5YS02YTRjMmUzMzY2NTAiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.XFUYyY3pfrcls-xJFq99vkjOSHqPk2l8z8q_MkpgqH4");

        if (error) throw new Error(error.message);
        else if (!user) throw new UnauthorizedException('User not found');

        return user;
    }
}
