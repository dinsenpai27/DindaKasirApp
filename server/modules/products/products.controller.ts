import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RequirePermissions } from '../auth/auth.guard.ts';
import {
  CreateCategoryDto,
  CreateProductDto,
  ImportCategoriesDto,
  ImportProductsDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from './products.dto.ts';
import { ProductsService } from './products.service.ts';

@ApiTags('Barang & Barcode')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get('categories')
  @RequirePermissions('categories', 'products', 'kasir', 'stock_in', 'returns', 'dashboard')
  @ApiOperation({ summary: 'Daftar semua kategori barang' })
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('categories')
  @RequirePermissions('categories')
  @ApiOperation({ summary: 'Tambah kategori barang baru' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Post('categories/import')
  @RequirePermissions('categories')
  @ApiOperation({ summary: 'Import kategori barang secara massal dari file Excel/CSV' })
  importCategories(@Body() dto: ImportCategoriesDto) {
    return this.productsService.importCategories(dto.items, dto.mode || 'upsert');
  }

  @Patch('categories/:id')
  @RequirePermissions('categories')
  @ApiOperation({ summary: 'Perbarui kategori barang' })
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.productsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions('categories')
  @ApiOperation({ summary: 'Hapus kategori barang' })
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeCategory(id);
  }

  @Get('products')
  @RequirePermissions('products', 'kasir', 'stock_in', 'returns', 'dashboard')
  @ApiOperation({ summary: 'Daftar semua barang beserta kategori dan stok' })
  @ApiQuery({ name: 'search', required: false, description: 'Cari berdasarkan nama, barcode, atau SKU' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'stockStatus', required: false, enum: ['all', 'low', 'out'] })
  findAllProducts(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('stockStatus') stockStatus?: string,
  ) {
    return this.productsService.findAllProducts({
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      stockStatus,
    });
  }

  @Get('products/barcode/:barcode')
  @RequirePermissions('kasir', 'products', 'stock_in')
  @ApiOperation({ summary: 'Scan barcode / SKU untuk lookup cepat di Kasir' })
  @ApiParam({ name: 'barcode', example: '8991002101012' })
  @ApiResponse({ status: 200, description: 'Produk ditemukan' })
  @ApiResponse({ status: 404, description: 'Barcode tidak terdaftar' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Post('products')
  @RequirePermissions('products')
  @ApiOperation({ summary: 'Tambah barang baru dengan barcode & harga HPP/jual' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Post('products/import')
  @RequirePermissions('products')
  @ApiOperation({ summary: 'Import produk massal dari Excel/CSV (otomatis membuat kategori baru jika belum ada)' })
  importProducts(@Body() dto: ImportProductsDto) {
    return this.productsService.importProducts(dto.items, dto.mode || 'upsert');
  }

  @Patch('products/:id')
  @RequirePermissions('products')
  @ApiOperation({ summary: 'Perbarui detail atau stok barang' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @RequirePermissions('products')
  @ApiOperation({ summary: 'Hapus barang' })
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeProduct(id);
  }
}
