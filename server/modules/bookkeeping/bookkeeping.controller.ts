import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RequirePermissions } from '../auth/auth.guard.ts';
import { CreateExpenseDto } from './bookkeeping.dto.ts';
import { BookkeepingService } from './bookkeeping.service.ts';

@ApiTags('Dashboard, Pengeluaran & Laporan')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class BookkeepingController {
  constructor(@Inject(BookkeepingService) private readonly bookkeepingService: BookkeepingService) {}

  @Get('dashboard/summary')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Ringkasan finansial dashboard, stok habis, dan analitik penjualan produk' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', 'month', 'custom'] })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-11-13' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-11-13' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, enum: [5, 10, 100] })
  getDashboardSummary(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookkeepingService.getDashboardSummary({
      period,
      startDate,
      endDate,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 5,
    });
  }

  @Get('expenses')
  @RequirePermissions('expenses')
  @ApiOperation({ summary: 'Daftar pengeluaran operasional toko' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAllExpenses(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.bookkeepingService.findAllExpenses({ startDate, endDate });
  }

  @Post('expenses')
  @RequirePermissions('expenses')
  @ApiOperation({ summary: 'Catat pengeluaran operasional toko baru' })
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.bookkeepingService.createExpense(dto);
  }

  @Delete('expenses/:id')
  @RequirePermissions('expenses')
  @ApiOperation({ summary: 'Hapus catatan pengeluaran' })
  removeExpense(@Param('id', ParseIntPipe) id: number) {
    return this.bookkeepingService.removeExpense(id);
  }

  @Get('reports/financial')
  @RequirePermissions('reports')
  @ApiOperation({ summary: 'Laporan laba rugi (Omzet, HPP, Laba Kotor, Pengeluaran, Laba Bersih)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getFinancialReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.bookkeepingService.getFinancialReport(startDate, endDate);
  }
}
