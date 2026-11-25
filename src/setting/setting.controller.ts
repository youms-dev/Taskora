import { Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { SettingService } from './setting.service';
import { JwtAuthGard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGard)
@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) { }

  @Patch("toggle-2fa")
  toggle2fa(@Req() req: any) {
    return this.settingService.toggle2Fa(req);
  }
}
