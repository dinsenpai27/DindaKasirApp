import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockInDto {
  @ApiProperty({ example: 8 })
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 13000, description: 'Harga beli per unit (HPP baru)' })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 'PT Sari Roti Nusantara' })
  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @ApiPropertyOptional({ example: 'Restock darurat rak depan' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  userId?: number;
}

export class CreateReturnDto {
  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsNumber()
  @IsOptional()
  saleId?: number | null;

  @ApiProperty({ example: 1 })
  @IsNumber()
  productId!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @Min(0)
  refundAmount!: number;

  @ApiProperty({ example: 'Kemasan rusak / kadaluarsa' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ enum: ['CUSTOMER_RETURN', 'SUPPLIER_RETURN'], example: 'CUSTOMER_RETURN' })
  @IsEnum(['CUSTOMER_RETURN', 'SUPPLIER_RETURN'])
  returnType!: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
