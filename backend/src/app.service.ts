import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Vedu LMS API is running';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'vedu-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
