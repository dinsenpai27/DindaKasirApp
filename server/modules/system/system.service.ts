import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DatabaseService } from '../../database/database.service.ts';
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateSettingsDto, UpdateUserDto } from './system.dto.ts';

@Injectable()
export class SystemService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  findAllRoles() {
    return this.db.data.roles.map((r) => ({
      ...r,
      userCount: this.db.data.users.filter((u) => u.roleId === r.id).length,
    }));
  }

  async createRole(dto: CreateRoleDto) {
    if (this.db.data.roles.some((r) => r.name.toLowerCase() === dto.name.trim().toLowerCase())) {
      throw new BadRequestException(`Role "${dto.name}" sudah ada.`);
    }
    const role = {
      id: this.db.nextId('roles'),
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      permissions: dto.permissions,
      createdAt: new Date().toISOString(),
    };
    this.db.data.roles.push(role);
    await this.db.commit();
    return role;
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = this.db.data.roles.find((r) => r.id === id);
    if (!role) throw new NotFoundException(`Role #${id} tidak ditemukan.`);
    if (dto.name !== undefined) role.name = dto.name.trim();
    if (dto.description !== undefined) role.description = dto.description.trim();
    if (dto.permissions !== undefined) role.permissions = dto.permissions;
    await this.db.commit();
    return role;
  }

  async removeRole(id: number) {
    const idx = this.db.data.roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException(`Role #${id} tidak ditemukan.`);
    if (this.db.data.users.some((u) => u.roleId === id)) {
      throw new BadRequestException('Role masih dipakai oleh user aktif.');
    }
    this.db.data.roles.splice(idx, 1);
    await this.db.commit();
    return { deleted: true, id };
  }

  findAllUsers() {
    const rolesMap = new Map(this.db.data.roles.map((r) => [r.id, r]));
    return this.db.data.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleId: u.roleId,
      roleName: rolesMap.get(u.roleId)?.name || 'User',
      permissions: rolesMap.get(u.roleId)?.permissions || [],
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  async createUser(dto: CreateUserDto) {
    if (this.db.data.users.some((u) => u.email.toLowerCase() === dto.email.trim().toLowerCase())) {
      throw new BadRequestException(`Email "${dto.email}" sudah terdaftar.`);
    }
    const role = this.db.data.roles.find((r) => r.id === dto.roleId);
    if (!role) throw new BadRequestException(`Role #${dto.roleId} tidak ditemukan.`);

    const user = {
      id: this.db.nextId('users'),
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      pin: dto.pin.trim(),
      roleId: dto.roleId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.db.data.users.push(user);
    await this.db.commit();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = this.db.data.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User #${id} tidak ditemukan.`);

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.email !== undefined) user.email = dto.email.trim().toLowerCase();
    if (dto.pin !== undefined) user.pin = dto.pin.trim();
    if (dto.roleId !== undefined) user.roleId = dto.roleId;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    await this.db.commit();
    const role = this.db.data.roles.find((r) => r.id === user.roleId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: role?.name || 'User',
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async removeUser(id: number) {
    if (id === 1) throw new BadRequestException('Administrator utama tidak dapat dihapus.');
    const idx = this.db.data.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new NotFoundException(`User #${id} tidak ditemukan.`);
    this.db.data.users.splice(idx, 1);
    await this.db.commit();
    return { deleted: true, id };
  }

  getSettings() {
    return this.db.data.settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const s = this.db.data.settings;
    if (dto.storeName !== undefined) s.storeName = dto.storeName.trim();
    if (dto.storeAddress !== undefined) s.storeAddress = dto.storeAddress.trim();
    if (dto.storePhone !== undefined) s.storePhone = dto.storePhone.trim();
    if (dto.taxRatePercent !== undefined) s.taxRatePercent = dto.taxRatePercent;
    if (dto.receiptFooter !== undefined) s.receiptFooter = dto.receiptFooter.trim();
    if (dto.invoicePrefix !== undefined) s.invoicePrefix = dto.invoicePrefix.trim().toUpperCase();
    s.updatedAt = new Date().toISOString();
    await this.db.commit();
    return s;
  }

  getPostgresSchemaSql() {
    const schemaPath = path.resolve(process.cwd(), 'database', 'postgres-schema.sql');
    if (fs.existsSync(schemaPath)) {
      return { sql: fs.readFileSync(schemaPath, 'utf-8') };
    }
    return { sql: '-- Schema file not found' };
  }
}
