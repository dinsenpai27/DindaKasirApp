import { CalendarDays, Clock, Lock, LogOut, Moon, PanelLeft, Sun, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CashierShift, User } from '../types/pos.ts';
import { hasPermission } from './Sidebar.tsx';

interface TopBarProps {
  onToggleSidebar: () => void;
  currentShift: CashierShift | null;
  onOpenShiftModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeUser: User | null;
  onLogout: () => void;
}

export function TopBar({
  onToggleSidebar,
  currentShift,
  onOpenShiftModal,
  darkMode,
  onToggleDarkMode,
  activeUser,
  onLogout,
}: TopBarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const dayStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const canOperateKasir = hasPermission(activeUser, 'kasir');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-2 text-xs font-medium text-slate-600 sm:flex dark:text-slate-300">
          {currentShift ? (
            <span className="text-emerald-700 dark:text-emerald-400">
              Shift Kasir Aktif · {currentShift.cashierName || 'Kasir'}
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400">Kasir Belum Dibuka</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {canOperateKasir && (
          <button
            type="button"
            onClick={onOpenShiftModal}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium text-white transition-colors ${
              currentShift
                ? 'bg-teal-700 hover:bg-teal-800'
                : 'bg-slate-800 hover:bg-slate-900 dark:bg-teal-700 dark:hover:bg-teal-800'
            }`}
          >
            {currentShift ? <Lock className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
            <span>{currentShift ? 'Tutup Kasir' : 'Buka Kasir'}</span>
          </button>
        )}

        <div className="hidden items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700 md:flex dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
          <CalendarDays className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span className="whitespace-nowrap font-medium">{dayStr}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono tabular-nums">{timeStr}</span>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle tema gelap/terang"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
          <span className="hidden font-medium text-slate-700 sm:inline dark:text-slate-200">
            {activeUser?.name} · <span className="text-teal-700 dark:text-teal-400">{activeUser?.roleName}</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
