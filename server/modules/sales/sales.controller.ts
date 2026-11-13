import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard, RequirePermissions } from '../auth/auth.guard.ts';
import { CloseShiftDto, CreateSaleDto, OpenShiftDto } from './sales.dto.ts';
import { SalesService } from './sales.service.ts';

@ApiTags('Kasir & Penjualan')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class SalesController {
  constructor(@Inject(SalesService) private readonly salesService: SalesService) {}

  @Get('shifts/current')
  @ApiOperation({ summary: 'Cek status shift kasir yang sedang aktif (Buka/Tutup Kasir)' })
  getCurrentShift(@Res() res: Response) {
    const shift = this.salesService.getCurrentShift();
    return res.status(200).json(shift);
  }

  @Get('shifts')
  @RequirePermissions('kasir', 'sales', 'reports')
  @ApiOperation({ summary: 'Riwayat seluruh shift kasir' })
  findAllShifts() {
    return this.salesService.findAllShifts();
  }

  @Post('shifts/open')
  @RequirePermissions('kasir')
  @ApiOperation({ summary: 'Buka Kasir (Mulai shift baru dengan modal awal)' })
  openShift(@Body() dto: OpenShiftDto) {
    return this.salesService.openShift(dto);
  }

  @Post('shifts/close')
  @RequirePermissions('kasir')
  @ApiOperation({ summary: 'Tutup Kasir dan hitung selisih kas' })
  closeShift(@Body() dto: CloseShiftDto) {
    return this.salesService.closeShift(dto);
  }

  @Get('sales')
  @RequirePermissions('sales', 'kasir', 'reports')
  @ApiOperation({ summary: 'Riwayat transaksi penjualan kasir' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-11-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-11-30' })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: ['ALL', 'CASH', 'QRIS', 'TRANSFER', 'DEBIT'] })
  @ApiQuery({ name: 'search', required: false })
  findAllSales(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
  ) {
    return this.salesService.findAllSales({ startDate, endDate, paymentMethod, search });
  }

  @Get('sales/:id')
  @RequirePermissions('sales', 'kasir')
  @ApiOperation({ summary: 'Detail struk transaksi penjualan' })
  findOneSale(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOneSale(id);
  }

  @Post('sales')
  @RequirePermissions('kasir')
  @ApiOperation({ summary: 'Proses pembayaran baru di Kasir (otomatis potong stok & hitung laba)' })
  createSale(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }

  @Post('sales/:id/void')
  @RequirePermissions('sales')
  @ApiOperation({ summary: 'Batalkan (Void) transaksi dan kembalikan stok barang' })
  voidSale(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.voidSale(id);
  }
}