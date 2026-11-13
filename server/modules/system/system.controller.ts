import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RequirePermissions } from '../auth/auth.guard.ts';
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateSettingsDto, UpdateUserDto } from './system.dto.ts';
import { SystemService } from './system.service.ts';

@ApiTags('Sistem, Users, Roles & Settings')
@Controller()
export class SystemController {
  constructor(@Inject(SystemService) private readonly systemService: SystemService) {}

  @Get('roles')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('roles', 'users')
  @ApiOperation({ summary: 'Daftar semua role dan hak akses (RBAC)' })
  findAllRoles() {
    return this.systemService.findAllRoles();
  }

  @Post('roles')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('roles')
  @ApiOperation({ summary: 'Tambah role baru' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.systemService.createRole(dto);
  }

  @Patch('roles/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('roles')
  @ApiOperation({ summary: 'Perbarui hak akses role' })
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.systemService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('roles')
  @ApiOperation({ summary: 'Hapus role' })
  removeRole(@Param('id', ParseIntPipe) id: number) {
    return this.systemService.removeRole(id);
  }

  @Get('users')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('users')
  @ApiOperation({ summary: 'Daftar pengguna & kasir' })
  findAllUsers() {
    return this.systemService.findAllUsers();
  }

  @Post('users')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('users')
  @ApiOperation({ summary: 'Tambah pengguna / kasir baru' })
  createUser(@Body() dto: CreateUserDto) {
    return this.systemService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('users')
  @ApiOperation({ summary: 'Perbarui data pengguna / status aktif / PIN' })
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.systemService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('users')
  @ApiOperation({ summary: 'Hapus pengguna' })
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.systemService.removeUser(id);
  }

  @Get('settings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pengaturan profil toko, pajak, dan struk kasir' })
  getSettings() {
    return this.systemService.getSettings();
  }

  @Patch('settings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('settings')
  @ApiOperation({ summary: 'Simpan perubahan pengaturan toko' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.systemService.updateSettings(dto);
  }

  @Get('system/schema-sql')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @RequirePermissions('settings', 'roles')
  @ApiOperation({ summary: 'Unduh / lihat skema DDL PostgreSQL untuk deployment database' })
  getPostgresSchemaSql() {
    return this.systemService.getPostgresSchemaSql();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check backend Nest.js' })
  health() {
    return { status: 'ok', service: 'KasirKu NestJS API', timestamp: new Date().toISOString() };
  }
}
