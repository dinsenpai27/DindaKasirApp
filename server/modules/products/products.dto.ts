import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Minuman Dingin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Berbagai minuman kemasan siap saji' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Minuman Kemasan' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Kategori minuman botol dan kaleng' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'MIN-0011', description: 'SKU otomatis dibuat oleh sistem jika dikosongkan' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '8991002109995', description: 'Kode barcode EAN-13 / Code-128 / QR (otomatis jika dikosongkan)' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ example: 'Kopi Kapal Api Special 165g' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  categoryId!: number;

  @ApiProperty({ example: 13500, description: 'Harga Pokok Penjualan (HPP)' })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 16500, description: 'Harga Jual ke Pelanggan' })
  @IsNumber()
  @Min(0)
  sellPrice!: number;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 'pcs', default: 'pcs' })
  @IsString()
  @IsOptional()
  unit?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'KOP-011' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '8991002109995' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: 'Kopi Kapal Api Special 165g' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 13500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 16500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellPrice?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 'pcs' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ImportCategoryRowDto {
  @ApiProperty({ example: 'Minuman Kemasan' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Kopi, teh, dan air mineral' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ImportCategoriesDto {
  @ApiProperty({ type: [ImportCategoryRowDto] })
  items!: ImportCategoryRowDto[];

  @ApiPropertyOptional({ enum: ['skip', 'upsert'], default: 'upsert' })
  @IsString()
  @IsOptional()
  mode?: 'skip' | 'upsert';
}

export class ImportProductRowDto {
  @ApiPropertyOptional({ example: 'KOP-012' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '8991002109999' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ example: 'Kopi Good Day Mocacinno 250ml' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Minuman' })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ example: 5200 })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 7000 })
  @IsNumber()
  @Min(0)
  sellPrice!: number;

  @ApiProperty({ example: 24 })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 'btl' })
  @IsString()
  @IsOptional()
  unit?: string;
}

export class ImportProductsDto {
  @ApiProperty({ type: [ImportProductRowDto] })
  items!: ImportProductRowDto[];

  @ApiPropertyOptional({ enum: ['skip', 'upsert'], default: 'upsert' })
  @IsString()
  @IsOptional()
  mode?: 'skip' | 'upsert';
}

