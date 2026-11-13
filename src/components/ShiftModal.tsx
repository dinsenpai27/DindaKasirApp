import { Lock, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { formatDateTime, formatRupiah } from '../lib/format.ts';
import type { CashierShift, User } from '../types/pos.ts';

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  currentShift: CashierShift | null;
  activeUser: User | null;
  onSuccess: () => Promise<void>;
}

export function ShiftModal({ open, onClose, currentShift, activeUser, onSuccess }: ShiftModalProps) {
  const [cashAmount, setCashAmount] = useState(currentShift ? String(currentShift.expectedCash || 0) : '250000');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCashAmount(currentShift ? String(currentShift.expectedCash || 0) : '250000');
      setNotes('');
      setError(null);
    }
  }, [open, currentShift]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const numeric = Number(cashAmount) || 0;
      if (currentShift) {
        await api.closeShift({ closingCash: numeric, notes });
      } else {
        await api.openShift({
          userId: activeUser?.id || 1,
          openingCash: numeric,
          notes,
        });
      }
      await onSuccess();
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {currentShift ? (
              <Lock className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            ) : (
              <Wallet className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            )}
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {currentShift ? 'Tutup Shift Kasir' : 'Buka Shift Kasir'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {currentShift && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Operator</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{currentShift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Dibuka</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatDateTime(currentShift.openedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Modal Awal</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatRupiah(currentShift.openingCash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Penjualan Tunai</span>
                <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(currentShift.cashSalesTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200">Estimasi Uang di Laci</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatRupiah(currentShift.expectedCash || 0)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {currentShift ? 'Total Uang Tunai Fisik (Rp)' : 'Modal Kas Awal (Rp)'}
            </label>
            <input
              type="number"
              min={0}
              required
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Shift
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={currentShift ? 'Misal: Setoran kas lengkap' : 'Misal: Shift pagi kasir utama'}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {submitting ? 'Memproses...' : currentShift ? 'Konfirmasi Tutup Kasir' : 'Buka Kasir Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
