import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Pembelian Kertas Thermal 80mm' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Perlengkapan Toko' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: '10 roll kertas struk kasir' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '2026-11-13' })
  @IsString()
  @IsOptional()
  expenseDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
