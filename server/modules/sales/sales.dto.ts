import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  userId!: number;

  @ApiProperty({ example: 250000, description: 'Saldo kas awal di laci kasir' })
  @IsNumber()
  @Min(0)
  openingCash!: number;

  @ApiPropertyOptional({ example: 'Shift pagi kasir 1' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 500000, description: 'Total uang tunai fisik saat tutup kasir' })
  @IsNumber()
  @Min(0)
  closingCash!: number;

  @ApiPropertyOptional({ example: 'Tutup kasir malam, saldo cocok' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SaleItemInputDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateSaleDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  cashierId!: number;

  @ApiProperty({ type: [SaleItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items!: SaleItemInputDto[];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({ enum: ['CASH', 'QRIS', 'TRANSFER', 'DEBIT'], example: 'CASH' })
  @IsEnum(['CASH', 'QRIS', 'TRANSFER', 'DEBIT'])
  paymentMethod!: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @ApiPropertyOptional({ example: 'Pelanggan umum' })
  @IsString()
  @IsOptional()
  notes?: string;
}
