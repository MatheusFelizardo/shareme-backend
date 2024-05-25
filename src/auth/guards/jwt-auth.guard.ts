import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err, user, info) {
    this.logger.log('User access from JWT id: ' + user?.id);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
