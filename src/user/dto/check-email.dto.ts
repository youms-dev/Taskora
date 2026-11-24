import { PickType } from '@nestjs/mapped-types';
import { LoginDto } from 'src/auth/dto/login.dto';
import { IsValidEmail } from 'src/decorators/validators/email.decorator';

export class CheckEmailDto extends PickType(LoginDto, ["email"]) {
    @IsValidEmail()
    newEmail: string;
}