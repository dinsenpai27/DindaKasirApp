import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './auth.dto.ts';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.ts';
import { AuthService } from './auth.service.ts';

@ApiTags('Autentikasi & Sesi')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user berdasarkan Email & PIN untuk mendapatkan token RBAC' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil profil user aktif beserta hak akses role terbaru' })
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout sesi aktif' })
  logout() {
    return { success: true };
  }
}
