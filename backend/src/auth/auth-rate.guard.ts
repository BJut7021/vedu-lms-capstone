import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
@Injectable()
export class AuthRateGuard implements CanActivate {
  constructor(private readonly db: DataSource) {}
  async canActivate(ctx: ExecutionContext) {
    if (ctx.getClass().name !== 'AuthController') return true;
    const name = ctx.getHandler().name;
    if (
      ![
        'login',
        'register',
        'guestLogin',
        'forgotPassword',
        'resetPassword',
      ].includes(name)
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const target = String(req.body?.email ?? req.body?.username ?? req.ip)
      .trim()
      .toLowerCase()
      .slice(0, 200);
    const windowSeconds = ['forgotPassword', 'resetPassword'].includes(name)
      ? 900
      : 60;
    const max =
      name === 'forgotPassword' ? 3 : name === 'resetPassword' ? 10 : 30;
    const hash = createHash('sha256').update(`${name}:${target}`).digest('hex');
    const [row] = await this.db.query(
      `INSERT INTO auth.request_limits(key_hash) VALUES($1)
    ON CONFLICT(key_hash) DO UPDATE SET requests=CASE WHEN auth.request_limits.window_start < now()-make_interval(secs=>$2) THEN 1 ELSE auth.request_limits.requests+1 END,
    window_start=CASE WHEN auth.request_limits.window_start < now()-make_interval(secs=>$2) THEN now() ELSE auth.request_limits.window_start END RETURNING requests`,
      [hash, windowSeconds],
    );
    if (Number(row.requests) > max)
      throw new HttpException(
        `Đã vượt số lần thử. Vui lòng chờ tối đa ${windowSeconds} giây.`,
        429,
      );
    return true;
  }
}
