import {
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  Boxes,
  Calculator,
  LayoutGrid,
  LogOut,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  Shield,
  Tag,
  TrendingDown,
  Users,
  X,
} from 'lucide-react';
import type { PageKey, User } from '../types/pos.ts';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeUser: User | null;
  storeName: string;
  onLogout: () => void;
}

interface NavItem {
  key: PageKey;
  permission: string | string[];
  label: string;
  icon: typeof LayoutGrid;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { key: 'dashboard', permission: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
      { key: 'kasir', permission: 'kasir', label: 'Kasir', icon: Calculator },
    ],
  },
  {
    label: 'Barang',
    items: [
      { key: 'products', permission: 'products', label: 'Daftar Barang', icon: Package },
      { key: 'categories', permission: 'categories', label: 'Kategori Barang', icon: Tag },
      { key: 'stock-in', permission: 'stock_in', label: 'Barang Masuk', icon: ArrowDownToLine },
      { key: 'returns', permission: 'returns', label: 'Retur Barang', icon: RotateCcw },
    ],
  },
  {
    label: 'Pembukuan',
    items: [
      { key: 'sales', permission: 'sales', label: 'Penjualan', icon: Receipt },
      { key: 'expenses', permission: 'expenses', label: 'Pengeluaran', icon: TrendingDown },
      { key: 'reports', permission: 'reports', label: 'Laporan', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { key: 'users', permission: 'users', label: 'Users', icon: Users },
      { key: 'roles', permission: 'roles', label: 'Roles', icon: Shield },
      { key: 'swagger', permission: ['settings', 'roles'], label: 'Swagger API', icon: BookOpen },
    ],
  },
];

export function hasPermission(user: User | null, perm: string | string[]): boolean {
  if (!user) return false;
  if (Array.isArray(perm)) {
    return perm.some((p) => user.permissions.includes(p));
  }
  return user.permissions.includes(perm);
}

export function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  mobileOpen,
  onCloseMobile,
  activeUser,
  storeName,
  onLogout,
}: SidebarProps) {
  const handleSelect = (key: PageKey) => {
    onNavigate(key);
    onCloseMobile();
  };

  const canAccessSettings = hasPermission(activeUser, 'settings');

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            if (hasPermission(activeUser, 'dashboard')) {
              handleSelect('dashboard');
            }
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Boxes className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {storeName || 'KasirKu'}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          aria-label="Tutup menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation groups filtered by RBAC permissions */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const allowedItems = group.items.filter((item) => hasPermission(activeUser, item.permission));
          if (allowedItems.length === 0) return null;

          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {allowedItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelect(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      {!collapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom settings + active user + logout */}
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        {canAccessSettings && (
          <button
            type="button"
            onClick={() => handleSelect('settings')}
            title={collapsed ? 'Settings' : undefined}
            className={`mb-2 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
              activePage === 'settings'
                ? 'bg-sky-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0 text-slate-400" />
            {!collapsed && <span className="whitespace-nowrap">Settings</span>}
          </button>
        )}

        <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {(activeUser?.name || 'US').slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                {activeUser?.name || 'Operator'}
              </div>
              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {activeUser?.roleName || 'User'}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-rose-600 dark:hover:bg-slate-700"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden shrink-0 transition-all duration-150 lg:block ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[80vw]">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
