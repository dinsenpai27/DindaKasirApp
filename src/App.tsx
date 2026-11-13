/**
 **
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ShiftModal } from './components/ShiftModal.tsx';
import { hasPermission, Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { api, getAuthToken, onUnauthorized, setAuthToken } from './lib/api.ts';
import { ExpensesPage, ReportsPage, SalesPage } from './pages/BookkeepingPages.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { CategoriesPage, ReturnsPage, StockInPage } from './pages/InventoryPages.tsx';
import { KasirPage } from './pages/KasirPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { RolesPage, SettingsPage, SwaggerApiPage, UsersPage } from './pages/SystemPages.tsx';
import type { CashierShift, PageKey, StoreSettings, User } from './types/pos.ts';

const PAGE_PERMISSION_MAP: Record<PageKey, string | string[]> = {
  dashboard: 'dashboard',
  kasir: 'kasir',
  products: 'products',
  categories: 'categories',
  'stock-in': 'stock_in',
  returns: 'returns',
  sales: 'sales',
  expenses: 'expenses',
  reports: 'reports',
  users: 'users',
  roles: 'roles',
  swagger: ['settings', 'roles'],
  settings: 'settings',
};

const PAGE_ORDER: PageKey[] = [
  'dashboard',
  'kasir',
  'products',
  'categories',
  'stock-in',
  'returns',
  'sales',
  'expenses',
  'reports',
  'users',
  'roles',
  'settings',
  'swagger',
];

function getFirstAllowedPage(user: User | null): PageKey {
  if (!user) return 'dashboard';
  for (const page of PAGE_ORDER) {
    if (hasPermission(user, PAGE_PERMISSION_MAP[page])) {
      return page;
    }
  }
  return 'dashboard';
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [authChecking, setAuthChecking] = useState(true);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setActiveUser(null);
    setCurrentShift(null);
    setActivePage('dashboard');
  }, []);

  useEffect(() => {
    onUnauthorized(handleLogout);
  }, [handleLogout]);

  const loadAuthenticatedContext = useCallback(async () => {
    try {
      const me = await api.getMe();
      const [shiftRes, settingsRes] = await Promise.allSettled([
        api.getCurrentShift(),
        api.getSettings(),
      ]);
      setActiveUser(me);
      if (shiftRes.status === 'fulfilled') {
        setCurrentShift(shiftRes.value);
      }
      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value);
      }
      setActivePage((prev) =>
        hasPermission(me, PAGE_PERMISSION_MAP[prev]) ? prev : getFirstAllowedPage(me),
      );
    } catch {
      handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    async function restoreSession() {
      const token = getAuthToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }
      await loadAuthenticatedContext();
      setAuthChecking(false);
    }
    void restoreSession();
  }, [loadAuthenticatedContext]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLoginSuccess = async (user: User) => {
    setActiveUser(user);
    setActivePage(getFirstAllowedPage(user));
    await loadAuthenticatedContext();
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-xs text-slate-500 dark:bg-slate-950">
        Memuat sesi KasirKu...
      </div>
    );
  }

  if (!activeUser) {
    return <LoginPage onLoginSuccess={(u) => void handleLoginSuccess(u)} />;
  }

  const isPageAllowed = hasPermission(activeUser, PAGE_PERMISSION_MAP[activePage]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeUser={activeUser}
        storeName={settings?.storeName || 'KasirKu'}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onToggleSidebar={handleToggleSidebar}
          currentShift={currentShift}
          onOpenShiftModal={() => setShiftModalOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          activeUser={activeUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6">
          {!isPageAllowed ? (
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <ShieldAlert className="mx-auto h-10 w-10 text-rose-600" />
              <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                Akses Modul Ditolak
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Role <strong>{activeUser.roleName}</strong> tidak memiliki izin untuk membuka halaman ini.
              </p>
              <button
                type="button"
                onClick={() => setActivePage(getFirstAllowedPage(activeUser))}
                className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                Kembali ke Halaman Utama
              </button>
            </div>
          ) : (
            <>
              {activePage === 'dashboard' && (
                <DashboardPage onNavigate={setActivePage} activeUser={activeUser} />
              )}
              {activePage === 'kasir' && (
                <KasirPage
                  activeUser={activeUser}
                  currentShift={currentShift}
                  onOpenShiftModal={() => setShiftModalOpen(true)}
                  settings={settings}
                />
              )}
              {activePage === 'products' && <ProductsPage />}
              {activePage === 'categories' && <CategoriesPage />}
              {activePage === 'stock-in' && <StockInPage activeUser={activeUser} />}
              {activePage === 'returns' && <ReturnsPage activeUser={activeUser} />}
              {activePage === 'sales' && <SalesPage settings={settings} />}
              {activePage === 'expenses' && <ExpensesPage activeUser={activeUser} />}
              {activePage === 'reports' && <ReportsPage />}
              {activePage === 'users' && (
                <UsersPage onUsersChanged={loadAuthenticatedContext} />
              )}
              {activePage === 'roles' && (
                <RolesPage onRolesChanged={loadAuthenticatedContext} />
              )}
              {activePage === 'swagger' && <SwaggerApiPage />}
              {activePage === 'settings' && (
                <SettingsPage settings={settings} onSaved={loadAuthenticatedContext} />
              )}
            </>
          )}
        </main>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <span>&copy; 2026 {settings?.storeName || 'KasirKu'}</span>
          {hasPermission(activeUser, ['settings', 'roles']) && (
            <button
              type="button"
              onClick={() => setActivePage('swagger')}
              className="hover:text-teal-700 dark:hover:text-teal-400"
            >
              Swagger API Docs (/api/docs)
            </button>
          )}
        </footer>
      </div>

      <ShiftModal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        currentShift={currentShift}
        activeUser={activeUser}
        onSuccess={loadAuthenticatedContext}
      />
    </div>
  );
}
