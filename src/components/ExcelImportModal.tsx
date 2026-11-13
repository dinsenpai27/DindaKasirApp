import { CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '../lib/api.ts';
import {
  downloadCategoryTemplate,
  downloadProductTemplate,
  parseCategoryExcel,
  parseProductExcel,
  type ParsedCategoryRow,
  type ParsedProductRow,
} from '../lib/excel.ts';
import { formatRupiah } from '../lib/format.ts';

interface ExcelImportModalProps {
  open: boolean;
  type: 'products' | 'categories';
  onClose: () => void;
  onImported: () => Promise<void>;
}

export function ExcelImportModal({ open, type, onClose, onImported }: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [mode, setMode] = useState<'upsert' | 'skip'>('upsert');
  const [productRows, setProductRows] = useState<ParsedProductRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<ParsedCategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  if (!open) return null;

  const resetState = () => {
    setFileName('');
    setProductRows([]);
    setCategoryRows([]);
    setError(null);
    setResultMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResultMsg(null);
    setFileName(file.name);

    try {
      if (type === 'products') {
        const parsed = await parseProductExcel(file);
        if (parsed.length === 0) {
          setError('Tidak ditemukan baris produk yang valid. Pastikan ada kolom "Nama Produk" dan gunakan template Excel.');
        }
        setProductRows(parsed);
      } else {
        const parsed = await parseCategoryExcel(file);
        if (parsed.length === 0) {
          setError('Tidak ditemukan baris kategori yang valid. Pastikan ada kolom "Nama Kategori" dan gunakan template Excel.');
        }
        setCategoryRows(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca file Excel.');
    }
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    try {
      if (type === 'products') {
        const res = await api.importProducts(productRows, mode);
        const catNote =
          res.autoCreatedCategories.length > 0
            ? ` · Kategori baru dibuat otomatis: ${res.autoCreatedCategories.join(', ')}`
            : '';
        setResultMsg(
          `Berhasil import produk: ${res.createdCount} baru, ${res.updatedCount} diperbarui, ${res.skippedCount} dilewati.${catNote}`,
        );
      } else {
        const res = await api.importCategories(categoryRows, mode);
        setResultMsg(
          `Berhasil import kategori: ${res.createdCount} baru, ${res.updatedCount} diperbarui, ${res.skippedCount} dilewati.`,
        );
      }
      await onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor data ke server.');
    } finally {
      setLoading(false);
    }
  };

  const rowCount = type === 'products' ? productRows.length : categoryRows.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {type === 'products' ? 'Upload Excel Daftar Barang' : 'Upload Excel Kategori Barang'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mendukung format .xlsx, .xls, dan .csv
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Step 1: Download Template & Upload File */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                1. Unduh Template &amp; Pilih File Excel
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {type === 'products'
                  ? 'Kolom: SKU, Barcode, Nama Produk, Kategori (otomatis dibuat jika baru), HPP, Harga Jual, Stok, Stok Minimum, Satuan.'
                  : 'Kolom: Nama Kategori, Deskripsi.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  type === 'products' ? downloadProductTemplate() : downloadCategoryTemplate()
                }
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Template</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-800"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{fileName ? 'Ganti File Excel' : 'Pilih File Excel'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => void handleFileChange(e)}
                className="hidden"
              />
            </div>
          </div>

          {fileName && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                File terpilih: <strong className="font-mono">{fileName}</strong> ({rowCount} baris valid)
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Jika SKU/Barcode/Nama sudah ada:</span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'upsert' | 'skip')}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="upsert">Perbarui Data (Upsert)</option>
                  <option value="skip">Lewati (Skip)</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {resultMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {type === 'products' && productRows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">SKU / Barcode</th>
                    <th className="px-3 py-2 font-medium">Nama Produk</th>
                    <th className="px-3 py-2 font-medium">Kategori</th>
                    <th className="px-3 py-2 text-right font-medium">HPP</th>
                    <th className="px-3 py-2 text-right font-medium">Harga Jual</th>
                    <th className="px-3 py-2 text-right font-medium">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productRows.slice(0, 50).map((r, i) => (
                    <tr key={`${r.name}-${i}`}>
                      <td className="px-3 py-2 font-mono text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">
                        <div>{r.sku || '(Auto)'}</div>
                        <div className="text-slate-400">{r.barcode || '(Auto EAN-13)'}</div>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{r.categoryName || 'Umum'}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{formatRupiah(r.costPrice, false)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{formatRupiah(r.sellPrice, false)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {r.stock} {r.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productRows.length > 50 && (
                <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800">
                  Menampilkan 50 baris pertama dari {productRows.length} total produk.
                </div>
              )}
            </div>
          )}

          {type === 'categories' && categoryRows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Nama Kategori</th>
                    <th className="px-3 py-2 font-medium">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryRows.map((c, i) => (
                    <tr key={`${c.name}-${i}`}>
                      <td className="px-3 py-2 font-mono text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{c.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={rowCount === 0 || loading}
            onClick={() => void handleImport()}
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Mengimpor...' : `Import ${rowCount} Data ke Database`}
          </button>
        </div>
      </div>
    </div>
  );
}
