import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.ts';
import { CategoryEntity, ProductEntity } from '../../database/database.types.ts';
import { CreateCategoryDto, CreateProductDto, UpdateCategoryDto, UpdateProductDto } from './products.dto.ts';

@Injectable()
export class ProductsService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  findAllCategories() {
    return this.db.data.categories.map((cat) => ({
      ...cat,
      productCount: this.db.data.products.filter((p) => p.categoryId === cat.id).length,
    }));
  }

  async createCategory(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (this.db.data.categories.some((c) => c.slug === slug)) {
      throw new BadRequestException(`Kategori "${dto.name}" sudah ada.`);
    }

    const category: CategoryEntity = {
      id: this.db.nextId('categories'),
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    this.db.data.categories.push(category);
    await this.db.commit();
    return category;
  }

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const cat = this.db.data.categories.find((c) => c.id === id);
    if (!cat) {
      throw new NotFoundException(`Kategori #${id} tidak ditemukan.`);
    }
    if (dto.name !== undefined) {
      cat.name = dto.name.trim();
      cat.slug = dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (dto.description !== undefined) {
      cat.description = dto.description.trim();
    }
    await this.db.commit();
    return cat;
  }

  async removeCategory(id: number) {
    const idx = this.db.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Kategori #${id} tidak ditemukan.`);
    }
    const used = this.db.data.products.some((p) => p.categoryId === id);
    if (used) {
      throw new BadRequestException('Kategori masih digunakan oleh produk.');
    }
    this.db.data.categories.splice(idx, 1);
    await this.db.commit();
    return { deleted: true, id };
  }

  findAllProducts(query?: { search?: string; categoryId?: number; stockStatus?: string }) {
    const categoriesMap = new Map(this.db.data.categories.map((c) => [c.id, c.name]));
    let list = this.db.data.products.map((p) => ({
      ...p,
      categoryName: categoriesMap.get(p.categoryId) || 'Umum',
    }));

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }

    if (query?.categoryId) {
      list = list.filter((p) => p.categoryId === query.categoryId);
    }

    if (query?.stockStatus === 'out') {
      list = list.filter((p) => p.stock <= 0);
    } else if (query?.stockStatus === 'low') {
      list = list.filter((p) => p.stock <= p.minStock);
    }

    return list;
  }

  findByBarcode(barcode: string) {
    const clean = barcode.trim();
    const product = this.db.data.products.find(
      (p) => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase(),
    );
    if (!product) {
      throw new NotFoundException(`Produk dengan barcode "${clean}" tidak ditemukan.`);
    }
    const category = this.db.data.categories.find((c) => c.id === product.categoryId);
    return {
      ...product,
      categoryName: category?.name || 'Umum',
    };
  }

  findOne(id: number): ProductEntity {
    const product = this.db.data.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Produk #${id} tidak ditemukan.`);
    }
    return product;
  }

  private generateAutoSku(categoryName: string, seedId: number): string {
    const letters = (categoryName || 'BRG')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3)
      .padEnd(3, 'X');
    let counter = seedId;
    let candidate = `${letters}-${String(counter).padStart(4, '0')}`;
    while (this.db.data.products.some((p) => p.sku.toLowerCase() === candidate.toLowerCase())) {
      counter += 1;
      candidate = `${letters}-${String(counter).padStart(4, '0')}`;
    }
    return candidate;
  }

  private generateAutoBarcode(seedId: number): string {
    let candidate = `899${String(seedId).padStart(4, '0')}${String(Math.floor(100000 + Math.random() * 899999))}`;
    while (this.db.data.products.some((p) => p.barcode === candidate)) {
      candidate = `899${String(seedId).padStart(4, '0')}${String(Math.floor(100000 + Math.random() * 899999))}`;
    }
    return candidate;
  }

  async createProduct(dto: CreateProductDto): Promise<ProductEntity> {
    const cat = this.db.data.categories.find((c) => c.id === dto.categoryId);
    if (!cat) {
      throw new BadRequestException(`Kategori #${dto.categoryId} tidak ditemukan.`);
    }

    const nextId = this.db.nextId('products');
    const cleanSku = dto.sku?.trim().toUpperCase() || this.generateAutoSku(cat.name, nextId);
    const cleanBarcode = dto.barcode?.trim() || this.generateAutoBarcode(nextId);

    if (this.db.data.products.some((p) => p.barcode === cleanBarcode)) {
      throw new BadRequestException(`Barcode "${cleanBarcode}" sudah terdaftar.`);
    }
    if (this.db.data.products.some((p) => p.sku.toLowerCase() === cleanSku.toLowerCase())) {
      throw new BadRequestException(`SKU "${cleanSku}" sudah terdaftar.`);
    }

    const now = new Date().toISOString();
    const product: ProductEntity = {
      id: nextId,
      sku: cleanSku,
      barcode: cleanBarcode,
      name: dto.name.trim(),
      categoryId: dto.categoryId,
      costPrice: dto.costPrice,
      sellPrice: dto.sellPrice,
      stock: dto.stock,
      minStock: dto.minStock ?? 5,
      unit: dto.unit?.trim() || 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.db.data.products.unshift(product);
    await this.db.commit();
    return product;
  }

  async updateProduct(id: number, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = this.findOne(id);

    if (dto.barcode && dto.barcode.trim() !== product.barcode) {
      if (this.db.data.products.some((p) => p.id !== id && p.barcode === dto.barcode!.trim())) {
        throw new BadRequestException(`Barcode "${dto.barcode}" sudah digunakan produk lain.`);
      }
      product.barcode = dto.barcode.trim();
    }

    if (dto.sku !== undefined) product.sku = dto.sku.trim().toUpperCase();
    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.costPrice !== undefined) product.costPrice = dto.costPrice;
    if (dto.sellPrice !== undefined) product.sellPrice = dto.sellPrice;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.minStock !== undefined) product.minStock = dto.minStock;
    if (dto.unit !== undefined) product.unit = dto.unit.trim();
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    product.updatedAt = new Date().toISOString();

    await this.db.commit();
    return product;
  }

  async removeProduct(id: number) {
    const idx = this.db.data.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Produk #${id} tidak ditemukan.`);
    }
    this.db.data.products.splice(idx, 1);
    await this.db.commit();
    return { deleted: true, id };
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async importCategories(
    rows: Array<{ name: string; description?: string }>,
    mode: 'skip' | 'upsert' = 'upsert',
  ) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Data kategori Excel kosong.');
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawName = String(row?.name || '').trim();
      if (!rawName) {
        errors.push(`Baris ${i + 1}: Nama kategori kosong.`);
        skippedCount += 1;
        continue;
      }

      const slug = this.toSlug(rawName);
      const existing = this.db.data.categories.find(
        (c) => c.slug === slug || c.name.toLowerCase() === rawName.toLowerCase(),
      );

      if (existing) {
        if (mode === 'upsert') {
          existing.name = rawName;
          if (row.description !== undefined) {
            existing.description = String(row.description).trim();
          }
          updatedCount += 1;
        } else {
          skippedCount += 1;
        }
        continue;
      }

      this.db.data.categories.push({
        id: this.db.nextId('categories'),
        name: rawName,
        slug: slug || `kategori-${Date.now()}`,
        description: String(row.description || '').trim(),
        createdAt: new Date().toISOString(),
      });
      createdCount += 1;
    }

    await this.db.commit();
    return { createdCount, updatedCount, skippedCount, errors };
  }

  async importProducts(
    rows: Array<{
      sku?: string;
      barcode?: string;
      name: string;
      categoryName?: string;
      categoryId?: number;
      costPrice: number;
      sellPrice: number;
      stock: number;
      minStock?: number;
      unit?: string;
    }>,
    mode: 'skip' | 'upsert' = 'upsert',
  ) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Data produk Excel kosong.');
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const autoCreatedCategories: string[] = [];
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row?.name || '').trim();
      if (!name) {
        errors.push(`Baris ${i + 1}: Nama produk wajib diisi.`);
        skippedCount += 1;
        continue;
      }

      // Resolve or auto-create category
      let resolvedCategoryId = Number(row.categoryId) || 0;
      const catName = String(row.categoryName || '').trim();
      if (catName) {
        const catSlug = this.toSlug(catName);
        let category = this.db.data.categories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase() || c.slug === catSlug,
        );
        if (!category) {
          category = {
            id: this.db.nextId('categories'),
            name: catName,
            slug: catSlug || `kategori-${Date.now()}`,
            description: 'Dibuat otomatis dari impor Excel',
            createdAt: now,
          };
          this.db.data.categories.push(category);
          autoCreatedCategories.push(catName);
        }
        resolvedCategoryId = category.id;
      }

      if (!resolvedCategoryId || !this.db.data.categories.some((c) => c.id === resolvedCategoryId)) {
        resolvedCategoryId = this.db.data.categories[0]?.id || 1;
      }

      const rawBarcode = String(row.barcode || '').trim();
      const rawSku = String(row.sku || '').trim().toUpperCase();
      const costPrice = Math.max(0, Number(row.costPrice) || 0);
      const sellPrice = Math.max(0, Number(row.sellPrice) || 0);
      const stock = Math.max(0, Math.floor(Number(row.stock) || 0));
      const minStock = Math.max(0, Math.floor(Number(row.minStock ?? 5) || 5));
      const unit = String(row.unit || 'pcs').trim() || 'pcs';

      const existing = this.db.data.products.find(
        (p) =>
          (rawBarcode && p.barcode === rawBarcode) ||
          (rawSku && p.sku.toLowerCase() === rawSku.toLowerCase()),
      );

      if (existing) {
        if (mode === 'upsert') {
          existing.name = name;
          existing.categoryId = resolvedCategoryId;
          existing.costPrice = costPrice;
          existing.sellPrice = sellPrice;
          existing.stock = stock;
          existing.minStock = minStock;
          existing.unit = unit;
          if (rawBarcode) existing.barcode = rawBarcode;
          if (rawSku) existing.sku = rawSku;
          existing.updatedAt = now;
          updatedCount += 1;
        } else {
          skippedCount += 1;
        }
        continue;
      }

      const nextId = this.db.nextId('products');
      const resolvedCat = this.db.data.categories.find((c) => c.id === resolvedCategoryId);
      const generatedSku = rawSku || this.generateAutoSku(resolvedCat?.name || 'BRG', nextId);
      const generatedBarcode = rawBarcode || this.generateAutoBarcode(nextId);

      this.db.data.products.unshift({
        id: nextId,
        sku: generatedSku,
        barcode: generatedBarcode,
        name,
        categoryId: resolvedCategoryId,
        costPrice,
        sellPrice,
        stock,
        minStock,
        unit,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      createdCount += 1;
    }

    await this.db.commit();
    return {
      createdCount,
      updatedCount,
      skippedCount,
      autoCreatedCategories,
      errors,
    };
  }
}
