import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.ts';
import { CreateReturnDto, CreateStockInDto } from './inventory.dto.ts';

@Injectable()
export class InventoryService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  findAllStockIns() {
    const productsMap = new Map(this.db.data.products.map((p) => [p.id, p]));
    const usersMap = new Map(this.db.data.users.map((u) => [u.id, u.name]));

    return this.db.data.stockIns
      .map((s) => {
        const prod = productsMap.get(s.productId);
        return {
          ...s,
          productName: prod?.name || 'Produk Dihapus',
          barcode: prod?.barcode || '-',
          unit: prod?.unit || 'pcs',
          userName: usersMap.get(s.userId) || 'Administrator',
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createStockIn(dto: CreateStockInDto) {
    const product = this.db.data.products.find((p) => p.id === dto.productId);
    if (!product) {
      throw new NotFoundException(`Produk #${dto.productId} tidak ditemukan.`);
    }

    const now = new Date().toISOString();
    const id = this.db.nextId('stockIns');
    const referenceNo = `PO-${now.slice(0, 7).replace('-', '')}-${String(id).padStart(3, '0')}`;

    product.stock += dto.quantity;
    if (dto.costPrice > 0) {
      product.costPrice = dto.costPrice;
    }
    product.updatedAt = now;

    const record = {
      id,
      referenceNo,
      productId: dto.productId,
      quantity: dto.quantity,
      costPrice: dto.costPrice,
      supplierName: dto.supplierName.trim(),
      notes: dto.notes?.trim() || '',
      userId: dto.userId || 1,
      createdAt: now,
    };

    this.db.data.stockIns.unshift(record);
    await this.db.commit();

    return {
      ...record,
      productName: product.name,
      newStock: product.stock,
    };
  }

  findAllReturns() {
    const productsMap = new Map(this.db.data.products.map((p) => [p.id, p]));
    const usersMap = new Map(this.db.data.users.map((u) => [u.id, u.name]));

    return this.db.data.returns
      .map((r) => {
        const prod = productsMap.get(r.productId);
        return {
          ...r,
          productName: prod?.name || 'Produk Dihapus',
          barcode: prod?.barcode || '-',
          userName: usersMap.get(r.userId) || 'Administrator',
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReturn(dto: CreateReturnDto) {
    const product = this.db.data.products.find((p) => p.id === dto.productId);
    if (!product) {
      throw new NotFoundException(`Produk #${dto.productId} tidak ditemukan.`);
    }

    if (dto.returnType === 'SUPPLIER_RETURN' && product.stock < dto.quantity) {
      throw new BadRequestException(`Stok produk tidak cukup untuk retur supplier (tersedia: ${product.stock}).`);
    }

    if (dto.returnType === 'CUSTOMER_RETURN') {
      product.stock += dto.quantity;
    } else {
      product.stock -= dto.quantity;
    }

    const now = new Date().toISOString();
    product.updatedAt = now;

    const id = this.db.nextId('returns');
    const returnNo = `RTR-${now.slice(0, 7).replace('-', '')}-${String(id).padStart(3, '0')}`;

    const record = {
      id,
      returnNo,
      saleId: dto.saleId ?? null,
      productId: dto.productId,
      quantity: dto.quantity,
      refundAmount: dto.refundAmount,
      reason: dto.reason.trim(),
      returnType: dto.returnType,
      userId: dto.userId || 1,
      createdAt: now,
    };

    this.db.data.returns.unshift(record);
    await this.db.commit();

    return {
      ...record,
      productName: product.name,
      newStock: product.stock,
    };
  }
}
