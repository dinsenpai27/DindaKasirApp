import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, AuthenticatedUser } from './auth.service.ts';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Requires the authenticated user's Role to grant AT LEAST ONE of the specified permissions.
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Silakan login terlebih dahulu (Bearer token diperlukan).');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const user = this.authService.verifyBearerToken(token);
    request.user = user;

    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const hasAccess = requiredPermissions.some((perm) => user.permissions.includes(perm));
    if (!hasAccess) {
      throw new ForbiddenException(
        `Akses ditolak: Role "${user.roleName}" tidak memiliki hak akses (${requiredPermissions.join(' / ')}).`,
      );
    }

    return true;
  }
}
