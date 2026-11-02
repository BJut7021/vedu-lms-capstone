
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

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

  async getSystemHealth() {
    let postgresql: 'ONLINE' | 'OFFLINE' = 'OFFLINE';
    let ml: 'ONLINE' | 'OFFLINE' = 'OFFLINE';

    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PostgreSQL timeout')), 2000),
        ),
      ]);
      postgresql = 'ONLINE';
    } catch {
      postgresql = 'OFFLINE';
    }

    try {
      const baseUrl =
        process.env.ML_SERVICE_URL || 'http://ml:8001';


const response = await fetch(`${baseUrl}/health`, {
  headers: {
    'X-ML-Token': process.env.ML_INTERNAL_TOKEN || '',
  },
  signal: AbortSignal.timeout(2000),
});


      if (response.ok) {
        const body = await response.json();
        if (body?.status === 'ok') {
          ml = 'ONLINE';
        }
      }
    } catch {
      ml = 'OFFLINE';
    }

    return {
      postgresql,
      ml,
      checkedAt: new Date().toISOString(),
    };
  }
}
