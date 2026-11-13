import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Supervisor' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Mengawasi shift kasir dan void transaksi' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['dashboard', 'kasir', 'sales', 'reports'] })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Supervisor Toko' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Deskripsi role' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['dashboard', 'kasir', 'sales'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class CreateUserDto {
  @ApiProperty({ example: 'Rina Kusuma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'rina.kasir@kasirku.id' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @IsNotEmpty()
  pin!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  roleId!: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Rina Kusuma' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'rina@kasirku.id' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  roleId?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'IR Beauty Store' })
  @IsString()
  @IsOptional()
  storeName?: string;

  @ApiPropertyOptional({ example: 'Hertasning Baru, Jl. Tun Abdul Razak, Paccinongang, Kec. Somba Opu, Kabupaten Gowa, Sulawesi Selatan 90235' })
  @IsString()
  @IsOptional()
  storeAddress?: string;

  @ApiPropertyOptional({ example: '087765417691' })
  @IsString()
  @IsOptional()
  storePhone?: string;

  @ApiPropertyOptional({ example: 11 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRatePercent?: number;

  @ApiPropertyOptional({ example: 'Terima kasih telah berbelanja!' })
  @IsString()
  @IsOptional()
  receiptFooter?: string;

  @ApiPropertyOptional({ example: 'INV' })
  @IsString()
  @IsOptional()
  invoicePrefix?: string;
}
