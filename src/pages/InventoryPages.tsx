import { Download, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ExcelImportModal } from '../components/ExcelImportModal.tsx';
import { api } from '../lib/api.ts';
import { exportCategoriesExcel } from '../lib/excel.ts';
import { formatDateTime, formatRupiah } from '../lib/format.ts';
import type { Category, Product, ReturnRecord, StockInRecord, User } from '../types/pos.ts';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setCategories(await api.getCategories());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createCategory({ name, description });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah kategori.');
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await api.deleteCategory(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kategori Barang
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelompokkan produk agar kasir lebih cepat menemukan barang. Mendukung import/export Excel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportCategoriesExcel(categories)}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setExcelImportOpen(true)}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-teal-700 bg-teal-50 px-3.5 py-2 text-xs font-medium text-teal-800 hover:bg-teal-100 dark:border-teal-600 dark:bg-teal-950/60 dark:text-teal-300"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Upload Excel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tambah Kategori</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Nama Kategori
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Alat Tulis"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan singkat kategori..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Simpan Kategori</span>
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-medium">Nama Kategori</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 text-right font-medium">Produk</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{c.slug}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.description || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{c.productCount ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-slate-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExcelImportModal
        open={excelImportOpen}
        type="categories"
        onClose={() => setExcelImportOpen(false)}
        onImported={load}
      />
    </div>
  );
}

export function StockInPage({ activeUser }: { activeUser: User | null }) {
  const [records, setRecords] = useState<StockInRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState('10');
  const [costPrice, setCostPrice] = useState('0');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, prods] = await Promise.all([api.getStockIns(), api.getProducts()]);
    setRecords(list);
    setProducts(prods);
    if (prods.length > 0 && productId === 0) {
      setProductId(prods[0].id);
      setCostPrice(String(prods[0].costPrice));
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createStockIn({
        productId,
        quantity: Number(quantity),
        costPrice: Number(costPrice),
        supplierName,
        notes,
        userId: activeUser?.id || 1,
      });
      setQuantity('10');
      setSupplierName('');
      setNotes('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan barang masuk.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Barang Masuk
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Catat pembelian stok dari supplier untuk memperbarui stok gudang &amp; HPP produk.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Catat Barang Masuk</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Produk</label>
            <select
              value={productId}
              onChange={(e) => {
                const pid = Number(e.target.value);
                setProductId(pid);
                const found = products.find((p) => p.id === pid);
                if (found) setCostPrice(String(found.costPrice));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Jumlah</label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">HPP Beli (Rp)</label>
              <input
                type="number"
                min={0}
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Supplier</label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="PT Distributor Jaya"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Catatan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nomor surat jalan / catatan"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            Simpan Barang Masuk
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 font-medium">No. Referensi</th>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">HPP</th>
                  <th className="px-4 py-3 text-right font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {r.referenceNo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {r.productName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.supplierName}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      +{r.quantity} {r.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatRupiah(r.costPrice, false)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500">
                      {formatDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReturnsPage({ activeUser }: { activeUser: User | null }) {
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number>(0);
  const [returnType, setReturnType] = useState<'CUSTOMER_RETURN' | 'SUPPLIER_RETURN'>('CUSTOMER_RETURN');
  const [quantity, setQuantity] = useState('1');
  const [refundAmount, setRefundAmount] = useState('0');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, prods] = await Promise.all([api.getReturns(), api.getProducts()]);
    setRecords(list);
    setProducts(prods);
    if (prods.length > 0 && productId === 0) {
      setProductId(prods[0].id);
      setRefundAmount(String(prods[0].sellPrice));
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createReturn({
        productId,
        returnType,
        quantity: Number(quantity),
        refundAmount: Number(refundAmount),
        reason,
        userId: activeUser?.id || 1,
      });
      setQuantity('1');
      setReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses retur barang.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Retur Barang
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Kelola pengembalian barang dari pelanggan maupun retur barang rusak ke supplier.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Catat Retur Baru</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Jenis Retur</label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="CUSTOMER_RETURN">Retur Pelanggan (+Stok)</option>
              <option value="SUPPLIER_RETURN">Retur ke Supplier (-Stok)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Produk</label>
            <select
              value={productId}
              onChange={(e) => {
                const pid = Number(e.target.value);
                setProductId(pid);
                const found = products.find((p) => p.id === pid);
                if (found) setRefundAmount(String(found.sellPrice));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Qty</label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Nominal (Rp)</label>
              <input
                type="number"
                min={0}
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Alasan Retur</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Kemasan rusak / kadaluarsa"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            Simpan Retur
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 font-medium">No. Retur</th>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Nilai Refund</th>
                  <th className="px-4 py-3 font-medium">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {r.returnNo}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.productName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {r.returnType === 'CUSTOMER_RETURN' ? 'Dari Pelanggan' : 'Ke Supplier'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{r.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatRupiah(r.refundAmount, false)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
