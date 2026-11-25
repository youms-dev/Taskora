import { Body, Controller, Delete, Req, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { DeleteSessionDto } from './dto/delete.dto';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) { }

  @UseGuards(JwtAuthGard)
  @Delete("delete")
  delete(@Req() req: any, @Body() data: DeleteSessionDto) {
    return this.sessionService.delete(req, data);
  }
}
