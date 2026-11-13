import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.ts';
import { CashierShiftEntity, SaleEntity, SaleItemEntity } from '../../database/database.types.ts';
import { CloseShiftDto, CreateSaleDto, OpenShiftDto } from './sales.dto.ts';

@Injectable()
export class SalesService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  getCurrentShift() {
    const shift = this.db.data.shifts.find((s) => s.status === 'OPEN') || null;
    if (!shift) return null;
    const user = this.db.data.users.find((u) => u.id === shift.userId);
    const shiftSales = this.db.data.sales.filter(
      (s) => s.shiftId === shift.id && s.status === 'COMPLETED',
    );
    const cashSalesTotal = shiftSales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((acc, s) => acc + s.totalAmount, 0);
    const nonCashSalesTotal = shiftSales
      .filter((s) => s.paymentMethod !== 'CASH')
      .reduce((acc, s) => acc + s.totalAmount, 0);

    return {
      ...shift,
      cashierName: user?.name || 'Kasir',
      transactionCount: shiftSales.length,
      cashSalesTotal,
      nonCashSalesTotal,
      expectedCash: shift.openingCash + cashSalesTotal,
    };
  }

  findAllShifts() {
    const usersMap = new Map(this.db.data.users.map((u) => [u.id, u.name]));
    return this.db.data.shifts
      .map((s) => ({
        ...s,
        cashierName: usersMap.get(s.userId) || 'Kasir',
      }))
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }

  async openShift(dto: OpenShiftDto): Promise<CashierShiftEntity> {
    const existing = this.db.data.shifts.find((s) => s.status === 'OPEN');
    if (existing) {
      throw new BadRequestException('Shift kasir masih terbuka. Tutup shift sebelumnya terlebih dahulu.');
    }

    const shift: CashierShiftEntity = {
      id: this.db.nextId('shifts'),
      userId: dto.userId,
      openedAt: new Date().toISOString(),
      closedAt: null,
      openingCash: dto.openingCash,
      closingCash: null,
      expectedCash: dto.openingCash,
      status: 'OPEN',
      notes: dto.notes || '',
    };

    this.db.data.shifts.unshift(shift);
    await this.db.commit();
    return shift;
  }

  async closeShift(dto: CloseShiftDto) {
    const current = this.db.data.shifts.find((s) => s.status === 'OPEN');
    if (!current) {
      throw new BadRequestException('Tidak ada shift kasir yang sedang terbuka.');
    }

    const cashSales = this.db.data.sales
      .filter((s) => s.shiftId === current.id && s.status === 'COMPLETED' && s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    current.closedAt = new Date().toISOString();
    current.closingCash = dto.closingCash;
    current.expectedCash = current.openingCash + cashSales;
    current.status = 'CLOSED';
    if (dto.notes) current.notes = dto.notes;

    await this.db.commit();
    return {
      ...current,
      variance: dto.closingCash - (current.expectedCash || 0),
    };
  }

  findAllSales(query?: { startDate?: string; endDate?: string; paymentMethod?: string; search?: string }) {
    const usersMap = new Map(this.db.data.users.map((u) => [u.id, u.name]));

    let list = this.db.data.sales.map((sale) => {
      const items = this.db.data.saleItems.filter((i) => i.saleId === sale.id);
      return {
        ...sale,
        cashierName: usersMap.get(sale.cashierId) || 'Administrator',
        items,
      };
    });

    if (query?.startDate) {
      list = list.filter((s) => s.createdAt.slice(0, 10) >= query.startDate!);
    }
    if (query?.endDate) {
      list = list.filter((s) => s.createdAt.slice(0, 10) <= query.endDate!);
    }
    if (query?.paymentMethod && query.paymentMethod !== 'ALL') {
      list = list.filter((s) => s.paymentMethod === query.paymentMethod);
    }
    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.cashierName.toLowerCase().includes(q) ||
          s.items.some((i) => i.productName.toLowerCase().includes(q) || i.barcode.includes(q)),
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOneSale(id: number) {
    const sale = this.db.data.sales.find((s) => s.id === id);
    if (!sale) {
      throw new NotFoundException(`Transaksi #${id} tidak ditemukan.`);
    }
    const items = this.db.data.saleItems.filter((i) => i.saleId === sale.id);
    const cashier = this.db.data.users.find((u) => u.id === sale.cashierId);
    return {
      ...sale,
      cashierName: cashier?.name || 'Administrator',
      items,
    };
  }

  async createSale(dto: CreateSaleDto) {
    const openShift = this.db.data.shifts.find((s) => s.status === 'OPEN') || null;
    const settings = this.db.data.settings;

    let subtotal = 0;
    let totalCost = 0;
    const preparedItems: Array<Omit<SaleItemEntity, 'id' | 'saleId'>> = [];

    for (const reqItem of dto.items) {
      const product = this.db.data.products.find((p) => p.id === reqItem.productId);
      if (!product) {
        throw new NotFoundException(`Produk #${reqItem.productId} tidak ditemukan.`);
      }
      if (product.stock < reqItem.quantity) {
        throw new BadRequestException(
          `Stok "${product.name}" tidak mencukupi (tersedia: ${product.stock}, diminta: ${reqItem.quantity}).`,
        );
      }

      const lineSubtotal = product.sellPrice * reqItem.quantity;
      const lineCost = product.costPrice * reqItem.quantity;
      subtotal += lineSubtotal;
      totalCost += lineCost;

      preparedItems.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity: reqItem.quantity,
        unitPrice: product.sellPrice,
        unitCost: product.costPrice,
        subtotal: lineSubtotal,
        profit: lineSubtotal - lineCost,
      });
    }

    const discount = Math.min(dto.discount ?? 0, subtotal);
    const afterDiscount = Math.max(0, subtotal - discount);
    const tax = Math.round((afterDiscount * (settings.taxRatePercent || 0)) / 100);
    const totalAmount = afterDiscount + tax;

    if (dto.paymentMethod === 'CASH' && dto.amountPaid < totalAmount) {
      throw new BadRequestException(
        `Nominal pembayaran tunai kurang dari total tagihan (Rp ${totalAmount.toLocaleString('id-ID')}).`,
      );
    }

    const amountPaid = dto.paymentMethod === 'CASH' ? dto.amountPaid : totalAmount;
    const changeAmount = Math.max(0, amountPaid - totalAmount);
    const grossProfit = afterDiscount - totalCost;

    // Deduct stock
    const nowIso = new Date().toISOString();
    for (const reqItem of dto.items) {
      const product = this.db.data.products.find((p) => p.id === reqItem.productId)!;
      product.stock -= reqItem.quantity;
      product.updatedAt = nowIso;
    }

    const saleId = this.db.nextId('sales');
    const dateStamp = nowIso.slice(0, 10).replace(/-/g, '');
    const seqNum = String(saleId).padStart(4, '0');
    const invoiceNumber = `${settings.invoicePrefix || 'INV'}-${dateStamp}-${seqNum}`;

    const sale: SaleEntity = {
      id: saleId,
      invoiceNumber,
      shiftId: openShift ? openShift.id : null,
      cashierId: dto.cashierId,
      subtotal,
      discount,
      tax,
      totalAmount,
      totalCost,
      grossProfit,
      paymentMethod: dto.paymentMethod,
      amountPaid,
      changeAmount,
      status: 'COMPLETED',
      notes: dto.notes || '',
      createdAt: nowIso,
    };

    const createdItems: SaleItemEntity[] = preparedItems.map((item) => ({
      id: this.db.nextId('saleItems'),
      saleId,
      ...item,
    }));

    this.db.data.sales.unshift(sale);
    this.db.data.saleItems.push(...createdItems);
    await this.db.commit();

    const cashier = this.db.data.users.find((u) => u.id === dto.cashierId);
    return {
      ...sale,
      cashierName: cashier?.name || 'Administrator',
      items: createdItems,
    };
  }

  async voidSale(id: number) {
    const sale = this.db.data.sales.find((s) => s.id === id);
    if (!sale) {
      throw new NotFoundException(`Transaksi #${id} tidak ditemukan.`);
    }
    if (sale.status === 'VOID') {
      throw new BadRequestException('Transaksi sudah dibatalkan sebelumnya.');
    }
    sale.status = 'VOID';
    const items = this.db.data.saleItems.filter((i) => i.saleId === sale.id);
    for (const item of items) {
      const product = this.db.data.products.find((p) => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
        product.updatedAt = new Date().toISOString();
      }
    }
    await this.db.commit();
    return sale;
  }
}
