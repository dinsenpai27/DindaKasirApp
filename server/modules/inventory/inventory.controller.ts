import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RequirePermissions } from '../auth/auth.guard.ts';
import { CreateReturnDto, CreateStockInDto } from './inventory.dto.ts';
import { InventoryService } from './inventory.service.ts';

@ApiTags('Barang Masuk & Retur')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class InventoryController {
  constructor(@Inject(InventoryService) private readonly inventoryService: InventoryService) {}

  @Get('stock-ins')
  @RequirePermissions('stock_in', 'products')
  @ApiOperation({ summary: 'Riwayat barang masuk / restock' })
  findAllStockIns() {
    return this.inventoryService.findAllStockIns();
  }

  @Post('stock-ins')
  @RequirePermissions('stock_in', 'dashboard')
  @ApiOperation({ summary: 'Catat barang masuk (otomatis menambah stok & perbarui HPP)' })
  createStockIn(@Body() dto: CreateStockInDto) {
    return this.inventoryService.createStockIn(dto);
  }

  @Get('returns')
  @RequirePermissions('returns')
  @ApiOperation({ summary: 'Riwayat retur barang (pelanggan & supplier)' })
  findAllReturns() {
    return this.inventoryService.findAllReturns();
  }

  @Post('returns')
  @RequirePermissions('returns')
  @ApiOperation({ summary: 'Catat retur barang dan sesuaikan stok' })
  createReturn(@Body() dto: CreateReturnDto) {
    return this.inventoryService.createReturn(dto);
  }
}
