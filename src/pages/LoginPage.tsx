import { Boxes, KeyRound, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { api, setAuthToken } from '../lib/api.ts';
import type { User } from '../types/pos.ts';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS = [
  {
    role: 'Administrator',
    email: 'admin@kasirku.id',
    pin: '123456',
    summary: 'Akses penuh: Dashboard, Kasir, Barang, Pembukuan, Users, Roles & Settings.',
  },
  {
    role: 'Kasir',
    email: 'siti.kasir@kasirku.id',
    pin: '112233',
    summary: 'Fokus operasional kasir: Dashboard, Kasir (Scan Barcode), Penjualan & Retur.',
  },
  {
    role: 'Staff Gudang',
    email: 'budi.gudang@kasirku.id',
    pin: '445566',
    summary: 'Fokus stok: Dashboard, Daftar Barang (Excel), Kategori, Barang Masuk & Retur.',
  },
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('admin@kasirku.id');
  const [pin, setPin] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, pin);
      setAuthToken(res.accessToken);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa email dan PIN Anda.');
    } finally {
      setLoading(false);
    }
  };

  const applyDemoAccount = (accEmail: string, accPin: string) => {
    setEmail(accEmail);
    setPin(accPin);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 dark:bg-slate-950">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
        {/* Left: Login Form */}
        <div className="p-6 sm:p-8 lg:col-span-7">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                IR Beauty Store
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masuk sesuai akun &amp; hak akses role Anda
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Operator
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@kasirku.id"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                PIN Akses
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke KasirKu'}</span>
            </button>
          </form>

          <p className="mt-5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Menu navigasi dan endpoint API secara otomatis menyesuaikan hak akses Role yang diatur oleh Administrator di menu <strong>Roles</strong>.
          </p>
        </div>

        {/* Right: Quick Role Presets */}
        <div className="border-t border-slate-100 bg-slate-50/80 p-6 lg:col-span-5 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-800/40">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>Akun Berdasarkan Role</span>
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const selected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => applyDemoAccount(acc.email, acc.pin)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    selected
                      ? 'border-teal-700 bg-white shadow-xs dark:border-teal-500 dark:bg-slate-900'
                      : 'border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      <UserCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                      {acc.role}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">PIN: {acc.pin}</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {acc.email}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {acc.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
