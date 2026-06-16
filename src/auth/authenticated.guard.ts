import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { RequestWithUser } from './auth.types';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.isAuthenticated?.() ?? false;
  }
}
