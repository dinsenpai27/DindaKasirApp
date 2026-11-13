import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { DatabaseService } from '../../database/database.service.ts';
import { LoginDto } from './auth.dto.ts';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  isActive: boolean;
}

interface TokenPayload {
  userId: number;
  email: string;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly secret = process.env.JWT_SECRET || 'kasirku-pos-local-secret-2026';

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  private signToken(payload: TokenPayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private decodeToken(token: string): TokenPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Format token tidak valid.');
    }
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', this.secret).update(body).digest('base64url');
    if (sig !== expectedSig) {
      throw new UnauthorizedException('Signature token tidak valid.');
    }
    let parsed: TokenPayload;
    try {
      parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Payload token rusak.');
    }
    if (!parsed.exp || Date.now() > parsed.exp) {
      throw new UnauthorizedException('Sesi login telah berakhir. Silakan login kembali.');
    }
    return parsed;
  }

  buildAuthUser(userId: number): AuthenticatedUser {
    const user = this.db.data.users.find((u) => u.id === userId);
    if (!user) {
      throw new UnauthorizedException('Akun pengguna tidak ditemukan.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda sedang dinonaktifkan oleh Administrator.');
    }
    const role = this.db.data.roles.find((r) => r.id === user.roleId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: role?.name || 'User',
      permissions: role?.permissions || [],
      isActive: user.isActive,
    };
  }

  login(dto: LoginDto) {
    const email = (dto.email || '').trim().toLowerCase();
    const pin = (dto.pin || '').trim();

    const user = this.db.data.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.pin !== pin) {
      throw new UnauthorizedException('Email atau PIN salah.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi Administrator.');
    }

    const authUser = this.buildAuthUser(user.id);
    const accessToken = this.signToken({
      userId: user.id,
      email: user.email,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return {
      accessToken,
      user: authUser,
    };
  }

  verifyBearerToken(token: string): AuthenticatedUser {
    const payload = this.decodeToken(token);
    return this.buildAuthUser(payload.userId);
  }
}
