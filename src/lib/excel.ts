import * as XLSX from 'xlsx';
import type { Category, Product } from '../types/pos.ts';

export interface ParsedProductRow {
  sku?: string;
  barcode?: string;
  name: string;
  categoryName?: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface ParsedCategoryRow {
  name: string;
  description: string;
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

function pickValue(row: Record<string, unknown>, aliases: string[]): unknown {
  const keys = Object.keys(row);
  for (const key of keys) {
    const norm = normalizeHeader(key);
    if (aliases.includes(norm)) {
      return row[key];
    }
  }
  return undefined;
}

function parseNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? fallback : num;
  }
  return fallback;
}

export async function parseProductExcel(file: File): Promise<ParsedProductRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
  return rawRows
    .map((row) => {
      const name = String(
        pickValue(row, ['namaproduk', 'nama', 'namabarang', 'produk', 'productname', 'name']) ?? '',
      ).trim();

      const sku = String(pickValue(row, ['sku', 'kode', 'kodesku', 'kodebarang']) ?? '').trim();
      const barcode = String(
        pickValue(row, ['barcode', 'kodebarcode', 'ean', 'ean13', 'upc']) ?? '',
      ).trim();
      const categoryName = String(
        pickValue(row, ['kategori', 'kategoribarang', 'kategoriproduk', 'category', 'categoryname']) ?? '',
      ).trim();

      const costPrice = parseNumber(
        pickValue(row, ['hpp', 'hargabeli', 'hargapokok', 'modal', 'costprice', 'cost']),
        0,
      );
      const sellPrice = parseNumber(
        pickValue(row, ['hargajual', 'harga', 'price', 'sellprice', 'hargajualrp']),
        0,
      );
      const stock = Math.floor(
        parseNumber(pickValue(row, ['stok', 'stock', 'qty', 'jumlah', 'stokawal']), 0),
      );
      const minStock = Math.floor(
        parseNumber(pickValue(row, ['stokminimum', 'stokmin', 'minstock', 'minimum']), 5),
      );
      const unit = String(pickValue(row, ['satuan', 'unit', 'uom']) ?? 'pcs').trim() || 'pcs';

      return {
        sku: sku || undefined,
        barcode: barcode || undefined,
        name,
        categoryName: categoryName || undefined,
        costPrice,
        sellPrice,
        stock,
        minStock,
        unit,
      };
    })
    .filter((r) => r.name.length > 0);
}

export async function parseCategoryExcel(file: File): Promise<ParsedCategoryRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
  return rawRows
    .map((row) => {
      const name = String(
        pickValue(row, ['namakategori', 'kategori', 'nama', 'category', 'name']) ?? '',
      ).trim();
      const description = String(
        pickValue(row, ['deskripsi', 'keterangan', 'catatan', 'description', 'desc']) ?? '',
      ).trim();
      return { name, description };
    })
    .filter((r) => r.name.length > 0);
}

export function downloadProductTemplate() {
  const sampleRows = [
    {
      'Nama Produk': 'Kopi Kapal Api Special 165g',
      Kategori: 'Minuman',
      Barcode: '8991002109995',
      HPP: 13500,
      'Harga Jual': 16500,
      Stok: 24,
      'Stok Minimum': 5,
      Satuan: 'pcs',
      SKU: '',
    },
    {
      'Nama Produk': 'Biskuit Roma Kelapa 300g',
      Kategori: 'Makanan Ringan',
      Barcode: '8992761122334',
      HPP: 9500,
      'Harga Jual': 12000,
      Stok: 30,
      'Stok Minimum': 6,
      Satuan: 'pack',
      SKU: '',
    },
    {
      'Nama Produk': 'Pulpen Standard AE7 Hitam',
      Kategori: 'Alat Tulis',
      Barcode: '',
      HPP: 2000,
      'Harga Jual': 3000,
      Stok: 50,
      'Stok Minimum': 10,
      Satuan: 'pcs',
      SKU: '',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
  XLSX.writeFile(wb, 'template-produk-kasirku.xlsx');
}

export function exportProductsExcel(products: Product[]) {
  const rows = products.map((p) => ({
    SKU: p.sku,
    Barcode: p.barcode,
    'Nama Produk': p.name,
    Kategori: p.categoryName || 'Umum',
    HPP: p.costPrice,
    'Harga Jual': p.sellPrice,
    Stok: p.stock,
    'Stok Minimum': p.minStock,
    Satuan: p.unit,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Barang');
  XLSX.writeFile(wb, `daftar-barang-kasirku-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadCategoryTemplate() {
  const sampleRows = [
    { 'Nama Kategori': 'Alat Tulis', Deskripsi: 'Buku tulis, pulpen, dan perlengkapan kantor' },
    { 'Nama Kategori': 'Kesehatan', Deskripsi: 'Masker, vitamin, dan P3K' },
    { 'Nama Kategori': 'Elektronik Ringan', Deskripsi: 'Baterai, kabel data, dan lampu LED' },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Kategori');
  XLSX.writeFile(wb, 'template-kategori-kasirku.xlsx');
}

export function exportCategoriesExcel(categories: Category[]) {
  const rows = categories.map((c) => ({
    'Nama Kategori': c.name,
    Slug: c.slug,
    Deskripsi: c.description || '',
    'Jumlah Produk': c.productCount ?? 0,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kategori Barang');
  XLSX.writeFile(wb, `kategori-kasirku-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
