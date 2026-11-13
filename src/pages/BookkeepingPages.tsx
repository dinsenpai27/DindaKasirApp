import { Ban, Download, Receipt, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { api } from '../lib/api.ts';
import { formatDateTime, formatRupiah, formatShortDate } from '../lib/format.ts';
import type { Expense, FinancialReport, Sale, StoreSettings, User } from '../types/pos.ts';

export function SalesPage({ settings }: { settings: StoreSettings | null }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setSales(
      await api.getSales({
        search: search.trim() || undefined,
        paymentMethod: paymentFilter,
      }),
    );
  }, [search, paymentFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleVoid = async (id: number) => {
    setError(null);
    try {
      await api.voidSale(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membatalkan transaksi.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Riwayat Penjualan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Daftar seluruh transaksi kasir, cetak ulang struk, dan pembatalan transaksi.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. invoice, produk, atau kasir..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="ALL">Semua Metode</option>
          <option value="CASH">Tunai (CASH)</option>
          <option value="QRIS">QRIS</option>
          <option value="TRANSFER">Transfer</option>
          <option value="DEBIT">Debit</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Kasir</th>
                <th className="px-4 py-3 font-medium">Metode</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Laba Kotor</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {s.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {formatDateTime(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">{s.cashierName}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatRupiah(s.totalAmount, false)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(s.grossProfit, false)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[11px] font-semibold ${
                        s.status === 'COMPLETED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      {s.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                      >
                        <Receipt className="h-3 w-3" />
                        <span>Struk</span>
                      </button>
                      {s.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => void handleVoid(s.id)}
                          title="Void Transaksi"
                          className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-slate-700"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal sale={selectedSale} settings={settings} onClose={() => setSelectedSale(null)} />
    </div>
  );
}

export function ExpensesPage({ activeUser }: { activeUser: User | null }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Operasional');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setExpenses(await api.getExpenses());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createExpense({
      title,
      category,
      amount: Number(amount),
      expenseDate,
      notes,
      userId: activeUser?.id || 1,
    });
    setTitle('');
    setAmount('');
    setNotes('');
    await load();
  };

  const handleDelete = async (id: number) => {
    await api.deleteExpense(id);
    await load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengeluaran Toko
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Catat biaya operasional toko untuk perhitungan Laba Bersih otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Catat Pengeluaran</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Nama Pengeluaran</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Beli Kertas Struk Thermal"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="Operasional">Operasional</option>
              <option value="Perlengkapan Toko">Perlengkapan Toko</option>
              <option value="Utilitas">Utilitas (Listrik/Air/Internet)</option>
              <option value="Gaji & Konsumsi">Gaji &amp; Konsumsi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Nominal (Rp)</label>
              <input
                type="number"
                min={0}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Catatan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            Simpan Pengeluaran
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Keterangan</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 text-right font-medium">Nominal</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {formatShortDate(exp.expenseDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{exp.title}</div>
                    {exp.notes && <div className="text-[11px] text-slate-400">{exp.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{exp.category}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                    {formatRupiah(exp.amount, false)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDelete(exp.id)}
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
    </div>
  );
}

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState<FinancialReport | null>(null);

  const load = useCallback(async () => {
    setReport(await api.getFinancialReport(startDate, endDate));
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['Tanggal', 'Jumlah Transaksi', 'Omzet (Rp)', 'Laba Kotor (Rp)', 'Pengeluaran (Rp)'],
      ...report.dailySeries.map((d) => [d.date, d.transactions, d.revenue, d.profit, d.expenses]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-kasirku-${startDate}-sd-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = report?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Laba Rugi &amp; Pembukuan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ringkasan omzet, HPP, laba kotor, pengeluaran, serta rincian per metode pembayaran.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Unduh CSV</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Periode:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
        />
        <span className="text-xs text-slate-400">s/d</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">Total Omzet ({s?.transactionCount ?? 0} trx)</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
            {formatRupiah(s?.totalRevenue ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">Laba Kotor (Omzet - HPP)</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatRupiah(s?.grossProfit ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">Total Pengeluaran</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {formatRupiah(s?.totalExpenses ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">Laba Bersih</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-teal-700 dark:text-teal-400">
            {formatRupiah(s?.netProfit ?? 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-3.5 text-sm font-semibold dark:border-slate-800">
            Metode Pembayaran
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-2.5 font-medium">Metode</th>
                <th className="px-4 py-2.5 text-right font-medium">Transaksi</th>
                <th className="px-4 py-2.5 text-right font-medium">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report?.paymentBreakdown.map((pm) => (
                <tr key={pm.method}>
                  <td className="px-4 py-3 font-mono font-semibold">{pm.method}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{pm.count}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatRupiah(pm.amount, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-3.5 text-sm font-semibold dark:border-slate-800">
            Rekap Harian
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 text-right font-medium">Trx</th>
                <th className="px-4 py-2.5 text-right font-medium">Omzet</th>
                <th className="px-4 py-2.5 text-right font-medium">Laba Kotor</th>
                <th className="px-4 py-2.5 text-right font-medium">Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report?.dailySeries.map((d) => (
                <tr key={d.date}>
                  <td className="px-4 py-3 font-mono">{formatShortDate(d.date)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{d.transactions}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatRupiah(d.revenue, false)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(d.profit, false)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                    {formatRupiah(d.expenses, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
