import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  LayoutGrid,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { formatRupiah, formatTimeOnly } from '../lib/format.ts';
import type { DashboardSummary, PageKey, User } from '../types/pos.ts';

interface DashboardPageProps {
  onNavigate: (page: PageKey) => void;
  activeUser: User | null;
}

export function DashboardPage({ onNavigate, activeUser }: DashboardPageProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(true);

  const [period, setPeriod] = useState<'today' | '7d' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<5 | 10 | 100>(5);

  // Quick Restock modal state
  const [restockItem, setRestockItem] = useState<{
    id: number;
    name: string;
    costPrice: number;
    unit: string;
  } | null>(null);
  const [restockQty, setRestockQty] = useState('20');
  const [restockSupplier, setRestockSupplier] = useState('Supplier Utama');
  const [restockCost, setRestockCost] = useState('');
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardSummary({
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
        search: search.trim() || undefined,
        page,
        limit,
      });
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, search, page, limit]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handlePeriodChange = (next: 'today' | '7d' | 'month') => {
    setPeriod(next);
    setPage(1);
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    if (next === 'today') {
      setStartDate(end);
      setEndDate(end);
    } else if (next === '7d') {
      const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStartDate(start);
      setEndDate(end);
    } else if (next === 'month') {
      setStartDate(`${end.slice(0, 7)}-01`);
      setEndDate(end);
    }
  };

  const openRestockModal = (item: { id: number; name: string; costPrice: number; unit: string }) => {
    setRestockItem(item);
    setRestockQty('20');
    setRestockCost(String(item.costPrice));
  };

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    setRestockSubmitting(true);
    try {
      await api.createStockIn({
        productId: restockItem.id,
        quantity: Math.max(1, Number(restockQty) || 1),
        costPrice: Number(restockCost) || restockItem.costPrice,
        supplierName: restockSupplier || 'Supplier Utama',
        notes: 'Quick restock dari Dashboard',
        userId: activeUser?.id || 1,
      });
      setRestockItem(null);
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses restock.');
    } finally {
      setRestockSubmitting(false);
    }
  };

  const fo = summary?.financialOverview;
  const analytics = summary?.productAnalytics;
  const outOfStock = summary?.outOfStock;

  return (
    <div className="space-y-5">
      {/* Page Title & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Terakhir disinkron:{' '}
            <span className="font-mono font-medium tabular-nums text-slate-700 dark:text-slate-300">
              {summary ? formatTimeOnly(summary.lastSyncedAt) : '--:--:--'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Overview Finansial Panel */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Overview Finansial
          </h2>
          <button
            type="button"
            onClick={() => setShowOverview((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span>{showOverview ? 'Sembunyikan' : 'Tampilkan'}</span>
            {showOverview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showOverview && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Row 1: Laba Kotor | Total Omzet */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Laba Kotor
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Margin{' '}
                      <span className="font-mono tabular-nums">
                        {fo?.grossMarginPercent ?? 0}%
                      </span>{' '}
                      · Omzet dikurangi HPP
                    </div>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(fo?.grossProfit ?? 0)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Total Omzet
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Penerimaan kotor transaksi ({fo?.transactionCount ?? 0} struk)
                    </div>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatRupiah(fo?.totalRevenue ?? 0)}
                </div>
              </div>
            </div>

            {/* Row 2: Pengeluaran Toko | Laba Bersih */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Pengeluaran Toko
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Operasional kas &amp; pengeluaran toko
                    </div>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {formatRupiah(fo?.totalExpenses ?? 0)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Laba Bersih
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Setelah seluruh pengeluaran operasional
                    </div>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-teal-700 dark:text-teal-400">
                  {formatRupiah(fo?.netProfit ?? 0)}
                </div>
              </div>
            </div>

            {/* Row 3: Volume Terjual */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Volume Terjual
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total unit barang yang laku terjual hari ini
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {fo?.unitsSold ?? 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">unit</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom 2-Column Section: Stok Habis & Analitik Penjualan Produk */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Left: Stok Habis */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Stok Habis
            </h2>
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
              {outOfStock?.count ?? 0} Produk
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Nama Produk</th>
                  <th className="px-4 py-2.5 text-center font-medium">Stok</th>
                  <th className="px-4 py-2.5 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!outOfStock || outOfStock.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Semua stok produk aman.
                    </td>
                  </tr>
                ) : (
                  outOfStock.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{item.barcode}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openRestockModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <span>Restock</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              {outOfStock?.count ?? 0} barang butuh restock
            </span>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
            >
              <span>Katalog Barang</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* Right: Analitik Penjualan Produk */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Analitik Penjualan Produk
            </h2>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7d', label: '7 Hari' },
                  { id: 'month', label: 'Bulan Ini' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handlePeriodChange(tab.id)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    period === tab.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriod('custom');
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriod('custom');
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="relative min-w-[180px] flex-1 sm:max-w-[240px]">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari produk..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Nama Produk</th>
                  <th className="px-4 py-2.5 text-right font-medium">Volume Terjual</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!analytics || analytics.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada penjualan pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  analytics.items.map((row, index) => (
                    <tr key={row.productId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-400">
                        {(analytics.page - 1) * analytics.limit + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {row.productName}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                          {row.volumeSold}
                        </span>{' '}
                        <span className="text-slate-500">item</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2.5">
                          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {row.contributionPercent.toFixed(1)}%
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-slate-800 dark:bg-teal-400"
                              style={{ width: `${Math.min(100, row.contributionPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
              <span>
                Menampilkan{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {analytics?.items.length ?? 0}
                </strong>{' '}
                dari{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {analytics?.totalProducts ?? 0}
                </strong>{' '}
                produk
              </span>
              <div className="flex items-center gap-1">
                <span>Limit:</span>
                {([5, 10, 100] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => {
                      setLimit(lv);
                      setPage(1);
                    }}
                    className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                      limit === lv
                        ? 'bg-slate-900 font-semibold text-white dark:bg-teal-700'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!analytics || analytics.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sebelumnya
              </button>
              <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                {analytics?.page ?? 1} / {analytics?.totalPages ?? 1}
              </span>
              <button
                type="button"
                disabled={!analytics || analytics.page >= analytics.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Berikutnya
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs dark:border-slate-800 dark:bg-slate-800/30">
            <span className="text-slate-500 dark:text-slate-400">
              Total Produk Terjual:{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {analytics?.totalUnitsSold ?? 0} item
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
            >
              <span>Riwayat Penjualan Lengkap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>

      {/* Quick Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Restock Cepat: {restockItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleQuickRestock} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Jumlah Masuk ({restockItem.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Harga Beli / HPP per {restockItem.unit} (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nama Supplier
                </label>
                <input
                  type="text"
                  required
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restockSubmitting}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {restockSubmitting ? 'Menyimpan...' : 'Simpan Barang Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
