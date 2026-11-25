import { Controller } from '@nestjs/common';
import { SettingService } from './setting.service';

// @UseGuards(JwtAuthGard)
@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) { }


}
