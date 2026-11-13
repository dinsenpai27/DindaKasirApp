import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.ts';
import { CreateExpenseDto } from './bookkeeping.dto.ts';

@Injectable()
export class BookkeepingService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  findAllExpenses(query?: { startDate?: string; endDate?: string }) {
    const usersMap = new Map(this.db.data.users.map((u) => [u.id, u.name]));
    let list = this.db.data.expenses.map((e) => ({
      ...e,
      userName: usersMap.get(e.userId) || 'Administrator',
    }));

    if (query?.startDate) {
      list = list.filter((e) => e.expenseDate >= query.startDate!);
    }
    if (query?.endDate) {
      list = list.filter((e) => e.expenseDate <= query.endDate!);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createExpense(dto: CreateExpenseDto) {
    const now = new Date();
    const record = {
      id: this.db.nextId('expenses'),
      title: dto.title.trim(),
      category: dto.category.trim(),
      amount: dto.amount,
      notes: dto.notes?.trim() || '',
      expenseDate: dto.expenseDate || now.toISOString().slice(0, 10),
      userId: dto.userId || 1,
      createdAt: now.toISOString(),
    };

    this.db.data.expenses.unshift(record);
    await this.db.commit();
    return record;
  }

  async removeExpense(id: number) {
    const idx = this.db.data.expenses.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Pengeluaran #${id} tidak ditemukan.`);
    }
    this.db.data.expenses.splice(idx, 1);
    await this.db.commit();
    return { deleted: true, id };
  }

  private resolveDateRange(period?: string, startDate?: string, endDate?: string) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (period === 'custom' && startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    if (period === '7d') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      return { start: past.toISOString().slice(0, 10), end: todayStr };
    }
    if (period === 'month') {
      return { start: `${todayStr.slice(0, 7)}-01`, end: todayStr };
    }
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    return { start: todayStr, end: todayStr };
  }

  getDashboardSummary(params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Overview Finansial for Today (or matching active period)
    const todaySales = this.db.data.sales.filter(
      (s) => s.status === 'COMPLETED' && s.createdAt.slice(0, 10) === todayStr,
    );
    const todaySaleIds = new Set(todaySales.map((s) => s.id));
    const todaySaleItems = this.db.data.saleItems.filter((i) => todaySaleIds.has(i.saleId));

    const totalRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = todaySales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = todaySales.reduce((sum, s) => sum + s.grossProfit, 0);
    const grossMarginPercent = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;

    const totalExpenses = this.db.data.expenses
      .filter((e) => e.expenseDate === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const unitsSold = todaySaleItems.reduce((sum, i) => sum + i.quantity, 0);

    // Stok Habis & Menipis
    const outOfStockProducts = this.db.data.products
      .filter((p) => p.isActive && p.stock <= 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        stock: p.stock,
        minStock: p.minStock,
        costPrice: p.costPrice,
        unit: p.unit,
      }));

    const lowStockProducts = this.db.data.products.filter((p) => p.isActive && p.stock > 0 && p.stock <= p.minStock);

    // Analitik Penjualan Produk (date range + search + pagination)
    const { start, end } = this.resolveDateRange(params.period, params.startDate, params.endDate);
    const filteredSales = this.db.data.sales.filter((s) => {
      if (s.status !== 'COMPLETED') return false;
      const d = s.createdAt.slice(0, 10);
      return d >= start && d <= end;
    });
    const filteredSaleIds = new Set(filteredSales.map((s) => s.id));
    const itemsInRange = this.db.data.saleItems.filter((i) => filteredSaleIds.has(i.saleId));

    const aggregated = new Map<
      number,
      { productId: number; productName: string; barcode: string; volumeSold: number; revenue: number; profit: number }
    >();

    for (const item of itemsInRange) {
      const existing = aggregated.get(item.productId);
      if (existing) {
        existing.volumeSold += item.quantity;
        existing.revenue += item.subtotal;
        existing.profit += item.profit;
      } else {
        aggregated.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          barcode: item.barcode,
          volumeSold: item.quantity,
          revenue: item.subtotal,
          profit: item.profit,
        });
      }
    }

    const totalUnitsInRange = Array.from(aggregated.values()).reduce((sum, r) => sum + r.volumeSold, 0);
    let analyticsRows = Array.from(aggregated.values())
      .map((row) => ({
        ...row,
        contributionPercent:
          totalUnitsInRange > 0 ? Number(((row.volumeSold / totalUnitsInRange) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.volumeSold - a.volumeSold);

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      analyticsRows = analyticsRows.filter(
        (r) => r.productName.toLowerCase().includes(q) || r.barcode.toLowerCase().includes(q),
      );
    }

    const totalProductsMatched = analyticsRows.length;
    const limit = Math.max(1, params.limit || 5);
    const totalPages = Math.max(1, Math.ceil(totalProductsMatched / limit));
    const page = Math.min(Math.max(1, params.page || 1), totalPages);
    const startIdx = (page - 1) * limit;
    const paginatedRows = analyticsRows.slice(startIdx, startIdx + limit);

    return {
      lastSyncedAt: new Date().toISOString(),
      financialOverview: {
        grossProfit,
        grossMarginPercent,
        totalRevenue,
        totalCost,
        totalExpenses,
        netProfit,
        unitsSold,
        transactionCount: todaySales.length,
      },
      outOfStock: {
        count: outOfStockProducts.length,
        lowStockCount: lowStockProducts.length,
        items: outOfStockProducts,
      },
      productAnalytics: {
        range: { startDate: start, endDate: end },
        totalUnitsSold: totalUnitsInRange,
        totalProducts: totalProductsMatched,
        page,
        limit,
        totalPages,
        items: paginatedRows,
      },
    };
  }

  getFinancialReport(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveDateRange(startDate && endDate ? 'custom' : 'month', startDate, endDate);

    const sales = this.db.data.sales.filter((s) => {
      if (s.status !== 'COMPLETED') return false;
      const d = s.createdAt.slice(0, 10);
      return d >= start && d <= end;
    });

    const expenses = this.db.data.expenses.filter((e) => e.expenseDate >= start && e.expenseDate <= end);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = sales.reduce((sum, s) => sum + s.totalCost, 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);
    const totalTax = sales.reduce((sum, s) => sum + s.tax, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const paymentBreakdown = (['CASH', 'QRIS', 'TRANSFER', 'DEBIT'] as const).map((method) => {
      const matching = sales.filter((s) => s.paymentMethod === method);
      return {
        method,
        count: matching.length,
        amount: matching.reduce((sum, s) => sum + s.totalAmount, 0),
      };
    });

    const dailyMap = new Map<string, { date: string; revenue: number; profit: number; expenses: number; transactions: number }>();
    for (const s of sales) {
      const d = s.createdAt.slice(0, 10);
      const entry = dailyMap.get(d) || { date: d, revenue: 0, profit: 0, expenses: 0, transactions: 0 };
      entry.revenue += s.totalAmount;
      entry.profit += s.grossProfit;
      entry.transactions += 1;
      dailyMap.set(d, entry);
    }
    for (const e of expenses) {
      const d = e.expenseDate;
      const entry = dailyMap.get(d) || { date: d, revenue: 0, profit: 0, expenses: 0, transactions: 0 };
      entry.expenses += e.amount;
      dailyMap.set(d, entry);
    }

    const dailySeries = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      range: { startDate: start, endDate: end },
      summary: {
        transactionCount: sales.length,
        totalRevenue,
        totalCost,
        totalDiscount,
        totalTax,
        grossProfit,
        totalExpenses,
        netProfit,
      },
      paymentBreakdown,
      dailySeries,
    };
  }
}
