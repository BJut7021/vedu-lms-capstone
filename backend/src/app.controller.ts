
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { Roles } from './auth/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Public()
  @Get('api/health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Roles('ADMIN')
  @Get('api/system-health')
  getSystemHealth() {
    return this.appService.getSystemHealth();
  }
}
