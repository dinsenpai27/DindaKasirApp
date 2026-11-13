import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PosDatabaseSchema } from './database.types.ts';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly dbFilePath = path.join(this.dataDir, 'kasirku-db.json');
  private state!: PosDatabaseSchema;
  private writeQueue: Promise<void> = Promise.resolve();

  onModuleInit() {
    this.loadOrSeed();
  }

  private loadOrSeed() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        this.state = JSON.parse(raw) as PosDatabaseSchema;
        return;
      } catch (err) {
        console.error('Failed to read database file, re-seeding:', err);
      }
    }

    this.state = this.createSeedData();
    this.persistSync();
  }

  get data(): PosDatabaseSchema {
    if (!this.state) {
      this.loadOrSeed();
    }
    return this.state;
  }

  nextId(table: keyof PosDatabaseSchema['sequences']): number {
    this.data.sequences[table] += 1;
    return this.data.sequences[table];
  }

  async commit(): Promise<void> {
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      const tmpPath = `${this.dbFilePath}.tmp`;
      await fs.promises.writeFile(tmpPath, snapshot, 'utf-8');
      await fs.promises.rename(tmpPath, this.dbFilePath);
    });
    return this.writeQueue;
  }

  private persistSync() {
    fs.writeFileSync(this.dbFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private createSeedData(): PosDatabaseSchema {
    const now = new Date();
    const todayIso = now.toISOString();
    const todayDate = todayIso.slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    return {
      sequences: {
        roles: 3,
        users: 3,
        categories: 5,
        products: 10,
        shifts: 1,
        sales: 3,
        saleItems: 6,
        stockIns: 2,
        returns: 1,
        expenses: 2,
      },
      roles: [
        {
          id: 1,
          name: 'Administrator',
          description: 'Akses penuh ke seluruh modul kasir, inventori, pembukuan, dan sistem.',
          permissions: ['dashboard', 'kasir', 'products', 'categories', 'stock_in', 'returns', 'sales', 'expenses', 'reports', 'users', 'roles', 'settings'],
          createdAt: twoDaysAgo,
        },
        {
          id: 2,
          name: 'Kasir',
          description: 'Akses transaksi kasir, scan barcode, buka/tutup shift, dan riwayat penjualan.',
          permissions: ['dashboard', 'kasir', 'sales', 'returns'],
          createdAt: twoDaysAgo,
        },
        {
          id: 3,
          name: 'Staff Gudang',
          description: 'Mengelola daftar barang, kategori, barang masuk, dan stok opname.',
          permissions: ['dashboard', 'products', 'categories', 'stock_in', 'returns'],
          createdAt: twoDaysAgo,
        },
      ],
      users: [
        {
          id: 1,
          name: 'Administrator',
          email: 'admin@kasirku.id',
          pin: '123456',
          roleId: 1,
          isActive: true,
          createdAt: twoDaysAgo,
        },
        {
          id: 2,
          name: 'Siti Rahma',
          email: 'siti.kasir@kasirku.id',
          pin: '112233',
          roleId: 2,
          isActive: true,
          createdAt: twoDaysAgo,
        },
        {
          id: 3,
          name: 'Budi Santoso',
          email: 'budi.gudang@kasirku.id',
          pin: '445566',
          roleId: 3,
          isActive: true,
          createdAt: twoDaysAgo,
        },
      ],
      categories: [
        { id: 1, name: 'Minuman', slug: 'minuman', description: 'Kopi, teh, air mineral, dan minuman kemasan', createdAt: twoDaysAgo },
        { id: 2, name: 'Makanan Ringan', slug: 'makanan-ringan', description: 'Snack, biskuit, dan mi instan', createdAt: twoDaysAgo },
        { id: 3, name: 'Sembako', slug: 'sembako', description: 'Kebutuhan pokok harian rumah tangga', createdAt: twoDaysAgo },
        { id: 4, name: 'Produk Susu & Roti', slug: 'susu-roti', description: 'Susu UHT, roti tawar, dan sarapan', createdAt: twoDaysAgo },
        { id: 5, name: 'Kebutuhan Rumah', slug: 'kebutuhan-rumah', description: 'Sabun, deterjen, dan tisu', createdAt: twoDaysAgo },
      ],
      products: [
        {
          id: 1,
          sku: 'KOP-001',
          barcode: '8991002101012',
          name: 'Kopi ABC Susu 31g',
          categoryId: 1,
          costPrice: 10000,
          sellPrice: 12000,
          stock: 48,
          minStock: 10,
          unit: 'pack',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 2,
          sku: 'MKN-002',
          barcode: '8998866200011',
          name: 'Indomie Goreng Original',
          categoryId: 2,
          costPrice: 2600,
          sellPrice: 3500,
          stock: 120,
          minStock: 24,
          unit: 'pcs',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 3,
          sku: 'MIN-003',
          barcode: '8996001600146',
          name: 'Teh Botol Sosro 450ml',
          categoryId: 1,
          costPrice: 4200,
          sellPrice: 6000,
          stock: 36,
          minStock: 12,
          unit: 'btl',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 4,
          sku: 'MIN-004',
          barcode: '8992775700105',
          name: 'Aqua Mineral 600ml',
          categoryId: 1,
          costPrice: 2500,
          sellPrice: 4000,
          stock: 65,
          minStock: 20,
          unit: 'btl',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 5,
          sku: 'SMB-005',
          barcode: '8991102203319',
          name: 'Minyak Goreng Bimoli 2L',
          categoryId: 3,
          costPrice: 33500,
          sellPrice: 38000,
          stock: 18,
          minStock: 5,
          unit: 'pch',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 6,
          sku: 'SMB-006',
          barcode: '8993175531016',
          name: 'Gula Pasir Gulaku 1kg',
          categoryId: 3,
          costPrice: 15500,
          sellPrice: 18500,
          stock: 22,
          minStock: 8,
          unit: 'pack',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 7,
          sku: 'SUS-007',
          barcode: '8998009010200',
          name: 'Susu Ultra Coklat 250ml',
          categoryId: 4,
          costPrice: 5400,
          sellPrice: 7000,
          stock: 30,
          minStock: 10,
          unit: 'pcs',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 8,
          sku: 'ROT-008',
          barcode: '8992753101207',
          name: 'Roti Tawar Sari Roti',
          categoryId: 4,
          costPrice: 13000,
          sellPrice: 16500,
          stock: 0,
          minStock: 5,
          unit: 'pcs',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 9,
          sku: 'SNK-009',
          barcode: '8991002310018',
          name: 'Chitato Sapi Panggang 68g',
          categoryId: 2,
          costPrice: 8500,
          sellPrice: 11500,
          stock: 4,
          minStock: 8,
          unit: 'pcs',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
        {
          id: 10,
          sku: 'RMH-010',
          barcode: '8999999004125',
          name: 'Rinso Anti Noda 770g',
          categoryId: 5,
          costPrice: 18000,
          sellPrice: 22500,
          stock: 15,
          minStock: 5,
          unit: 'pcs',
          isActive: true,
          createdAt: twoDaysAgo,
          updatedAt: todayIso,
        },
      ],
      shifts: [
        {
          id: 1,
          userId: 1,
          openedAt: todayIso,
          closedAt: null,
          openingCash: 250000,
          closingCash: null,
          expectedCash: null,
          status: 'OPEN',
          notes: 'Shift pagi kasir utama',
        },
      ],
      sales: [
        {
          id: 1,
          invoiceNumber: `INV-${todayDate.replace(/-/g, '')}-0001`,
          shiftId: 1,
          cashierId: 1,
          subtotal: 12000,
          discount: 0,
          tax: 0,
          totalAmount: 12000,
          totalCost: 10000,
          grossProfit: 2000,
          paymentMethod: 'CASH',
          amountPaid: 20000,
          changeAmount: 8000,
          status: 'COMPLETED',
          notes: 'Transaksi scan barcode',
          createdAt: todayIso,
        },
        {
          id: 2,
          invoiceNumber: `INV-${todayDate.replace(/-/g, '')}-0002`,
          shiftId: 1,
          cashierId: 2,
          subtotal: 25000,
          discount: 0,
          tax: 0,
          totalAmount: 25000,
          totalCost: 19200,
          grossProfit: 5800,
          paymentMethod: 'QRIS',
          amountPaid: 25000,
          changeAmount: 0,
          status: 'COMPLETED',
          notes: '',
          createdAt: todayIso,
        },
        {
          id: 3,
          invoiceNumber: `INV-${yesterday.slice(0, 10).replace(/-/g, '')}-0001`,
          shiftId: null,
          cashierId: 1,
          subtotal: 56500,
          discount: 0,
          tax: 0,
          totalAmount: 56500,
          totalCost: 49000,
          grossProfit: 7500,
          paymentMethod: 'TRANSFER',
          amountPaid: 56500,
          changeAmount: 0,
          status: 'COMPLETED',
          notes: '',
          createdAt: yesterday,
        },
      ],
      saleItems: [
        {
          id: 1,
          saleId: 1,
          productId: 1,
          productName: 'Kopi ABC Susu 31g',
          barcode: '8991002101012',
          quantity: 1,
          unitPrice: 12000,
          unitCost: 10000,
          subtotal: 12000,
          profit: 2000,
        },
        {
          id: 2,
          saleId: 2,
          productId: 2,
          productName: 'Indomie Goreng Original',
          barcode: '8998866200011',
          quantity: 4,
          unitPrice: 3500,
          unitCost: 2600,
          subtotal: 14000,
          profit: 3600,
        },
        {
          id: 3,
          saleId: 2,
          productId: 4,
          productName: 'Aqua Mineral 600ml',
          barcode: '8992775700105',
          quantity: 1,
          unitPrice: 4000,
          unitCost: 2500,
          subtotal: 4000,
          profit: 1500,
        },
        {
          id: 4,
          saleId: 2,
          productId: 7,
          productName: 'Susu Ultra Coklat 250ml',
          barcode: '8998009010200',
          quantity: 1,
          unitPrice: 7000,
          unitCost: 5400,
          subtotal: 7000,
          profit: 1600,
        },
        {
          id: 5,
          saleId: 3,
          productId: 5,
          productName: 'Minyak Goreng Bimoli 2L',
          barcode: '8991102203319',
          quantity: 1,
          unitPrice: 38000,
          unitCost: 33500,
          subtotal: 38000,
          profit: 4500,
        },
        {
          id: 6,
          saleId: 3,
          productId: 6,
          productName: 'Gula Pasir Gulaku 1kg',
          barcode: '8993175531016',
          quantity: 1,
          unitPrice: 18500,
          unitCost: 15500,
          subtotal: 18500,
          profit: 3000,
        },
      ],
      stockIns: [
        {
          id: 1,
          referenceNo: 'PO-202611-001',
          productId: 1,
          quantity: 50,
          costPrice: 10000,
          supplierName: 'PT Santos Jaya Abadi',
          notes: 'Restock mingguan kopi sachet',
          userId: 3,
          createdAt: yesterday,
        },
        {
          id: 2,
          referenceNo: 'PO-202611-002',
          productId: 2,
          quantity: 120,
          costPrice: 2600,
          supplierName: 'PT Indofood CBP',
          notes: '3 dus Indomie Goreng',
          userId: 3,
          createdAt: yesterday,
        },
      ],
      returns: [
        {
          id: 1,
          returnNo: 'RTR-202611-001',
          saleId: null,
          productId: 9,
          quantity: 2,
          refundAmount: 17000,
          reason: 'Kemasan penyok saat pengiriman supplier',
          returnType: 'SUPPLIER_RETURN',
          userId: 3,
          createdAt: yesterday,
        },
      ],
      expenses: [
        {
          id: 1,
          title: 'Plastik Kresek & Kertas Thermal Struk',
          category: 'Perlengkapan Toko',
          amount: 0,
          notes: 'Sudah termasuk stok awal bulan',
          expenseDate: todayDate,
          userId: 1,
          createdAt: todayIso,
        },
        {
          id: 2,
          title: 'Token Listrik Toko',
          category: 'Utilitas',
          amount: 150000,
          notes: 'Pembayaran listrik prabayar',
          expenseDate: yesterday.slice(0, 10),
          userId: 1,
          createdAt: yesterday,
        },
      ],
      settings: {
        storeName: 'IR Beauty Store',
        storeAddress: 'Hertasning Baru, Jl. Tun Abdul Razak, Paccinongang, Kec. Somba Opu, Kabupaten Gowa, Sulawesi Selatan 90235',
        storePhone: '087765417691',
        taxRatePercent: 0,
        receiptFooter: 'Terima kasih telah berbelanja di IR Beauty Store! Barang yang sudah dibeli tidak dapat ditukar kecuali cacat produksi.',
        currency: 'IDR',
        invoicePrefix: 'INV',
        updatedAt: todayIso,
      },
    };
  }
}
