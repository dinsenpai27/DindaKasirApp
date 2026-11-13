import { BookOpen, Check, Copy, Database, Edit3, ExternalLink, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import type { Role, StoreSettings, User } from '../types/pos.ts';

export function UsersPage({ onUsersChanged }: { onUsersChanged: () => Promise<void> }) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('123456');
  const [roleId, setRoleId] = useState(2);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRoleId, setEditRoleId] = useState(2);
  const [editPin, setEditPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([api.getUsers(), api.getRoles()]);
    setUsers(u);
    setRoles(r);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createUser({ name, email, pin, roleId });
      setName('');
      setEmail('');
      await load();
      await onUsersChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah user.');
    }
  };

  const handleToggleActive = async (user: User) => {
    await api.updateUser(user.id, { isActive: !user.isActive });
    await load();
    await onUsersChanged();
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    try {
      await api.updateUser(editingUser.id, {
        roleId: editRoleId,
        ...(editPin.trim() ? { pin: editPin.trim() } : {}),
      });
      setEditingUser(null);
      setEditPin('');
      await load();
      await onUsersChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui user.');
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await api.deleteUser(id);
      await load();
      await onUsersChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus user.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manajemen Users
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Kelola akun kasir, PIN login, status aktif, dan penetapan Role.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tambah User Baru</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Email Login</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">PIN Login</label>
              <input
                type="text"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            Tambah User
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 font-medium">{u.roleName}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(u)}
                      className={`text-xs font-semibold ${
                        u.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(u);
                          setEditRoleId(u.roleId);
                          setEditPin('');
                        }}
                        title="Ubah Role / PIN"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {u.id !== 1 && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(u.id)}
                          className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-slate-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Edit Akses: {editingUser.name}
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditUser} className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Reset PIN Baru (kosongkan jika tidak diubah)
                </label>
                <input
                  type="text"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="PIN baru..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_PERMISSIONS: Array<{ id: string; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'kasir', label: 'Kasir & Shift' },
  { id: 'products', label: 'Daftar Barang' },
  { id: 'categories', label: 'Kategori Barang' },
  { id: 'stock_in', label: 'Barang Masuk' },
  { id: 'returns', label: 'Retur Barang' },
  { id: 'sales', label: 'Penjualan' },
  { id: 'expenses', label: 'Pengeluaran' },
  { id: 'reports', label: 'Laporan' },
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
  { id: 'settings', label: 'Settings & API' },
];

export function RolesPage({ onRolesChanged }: { onRolesChanged?: () => Promise<void> }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['dashboard', 'kasir']);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRoles(await api.getRoles());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  };

  const toggleEditPerm = (perm: string) => {
    setEditPerms((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createRole({ name, description, permissions: selectedPerms });
      setName('');
      setDescription('');
      await load();
      await onRolesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah role.');
    }
  };

  const handleSaveEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setError(null);
    try {
      await api.updateRole(editingRole.id, {
        description: editDesc,
        permissions: editPerms,
      });
      setEditingRole(null);
      await load();
      await onRolesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui hak akses role.');
    }
  };

  const handleDeleteRole = async (id: number) => {
    setError(null);
    try {
      await api.deleteRole(id);
      await load();
      await onRolesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus role.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Roles &amp; Hak Akses
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Atur izin modul untuk setiap peran. Perubahan langsung membatasi menu dan API user terkait.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Buat Role Baru</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Nama Role</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Hak Akses Modul
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePerm(perm.id)}
                    className="rounded border-slate-300 text-teal-700"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            Simpan Role
          </button>
        </form>

        <div className="space-y-3 lg:col-span-8">
          {roles.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</h3>
                  <p className="text-xs text-slate-500">{r.description || '-'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{r.userCount ?? 0} user</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRole(r);
                      setEditPerms([...r.permissions]);
                      setEditDesc(r.description);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Hak Akses</span>
                  </button>
                  {r.id !== 1 && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteRole(r.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-slate-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                {r.permissions.map((perm, idx) => (
                  <span key={perm}>
                    {ALL_PERMISSIONS.find((p) => p.id === perm)?.label || perm}
                    {idx < r.permissions.length - 1 && <span className="ml-2 text-slate-300">·</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Atur Hak Akses: {editingRole.name}
              </h3>
              <button type="button" onClick={() => setEditingRole(null)} className="text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditRole} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Deskripsi</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Modul yang Diizinkan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={editPerms.includes(perm.id)}
                        onChange={() => toggleEditPerm(perm.id)}
                        className="rounded border-slate-300 text-teal-700"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
                >
                  Simpan Hak Akses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsPage({
  settings,
  onSaved,
}: {
  settings: StoreSettings | null;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    storeName: settings?.storeName || 'IR Beauty Store',
    storeAddress: settings?.storeAddress || '',
    storePhone: settings?.storePhone || '',
    taxRatePercent: String(settings?.taxRatePercent ?? 0),
    invoicePrefix: settings?.invoicePrefix || 'INV',
    receiptFooter: settings?.receiptFooter || '',
  });
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateSettings({
      storeName: form.storeName,
      storeAddress: form.storeAddress,
      storePhone: form.storePhone,
      taxRatePercent: Number(form.taxRatePercent) || 0,
      invoicePrefix: form.invoicePrefix,
      receiptFooter: form.receiptFooter,
    });
    await onSaved();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengaturan Toko
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Konfigurasi identitas toko, tarif PPN, prefix nomor struk, dan catatan kaki struk.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Nama Toko</label>
          <input
            type="text"
            required
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Alamat Toko</label>
          <input
            type="text"
            value={form.storeAddress}
            onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">No. Telepon</label>
            <input
              type="text"
              value={form.storePhone}
              onChange={(e) => setForm({ ...form, storePhone: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Tarif Pajak (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={form.taxRatePercent}
              onChange={(e) => setForm({ ...form, taxRatePercent: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Prefix Invoice</label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Footer Struk</label>
          <textarea
            rows={2}
            value={form.receiptFooter}
            onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {savedBanner && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Pengaturan toko berhasil disimpan.
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-2 text-xs font-medium text-white hover:bg-teal-800"
        >
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}

export function SwaggerApiPage() {
  const [tab, setTab] = useState<'swagger' | 'postgres'>('swagger');
  const [sqlSchema, setSqlSchema] = useState<string>('Memuat skema PostgreSQL...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void api.getPostgresSchemaSql().then((res) => setSqlSchema(res.sql)).catch(() => {
      setSqlSchema('-- Tidak dapat memuat skema (akses terbatas)');
    });
  }, []);

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Nest.js Swagger API &amp; Skema PostgreSQL
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dokumentasi interaktif OpenAPI di <span className="font-mono">/api/docs</span> beserta skema DDL PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTab('swagger')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === 'swagger'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Swagger UI</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('postgres')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === 'postgres'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Skema PostgreSQL</span>
            </button>
          </div>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>Buka Tab Baru</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {tab === 'swagger' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800">
          <iframe
            src="/api/docs"
            title="Swagger UI IR Beauty Store"
            className="h-[74vh] w-full border-0 bg-white"
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span className="font-mono text-xs text-slate-300">database/postgres-schema.sql</span>
            <button
              type="button"
              onClick={() => void handleCopySql()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin SQL'}</span>
            </button>
          </div>
          <pre className="max-h-[70vh] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
            {sqlSchema}
          </pre>
        </div>
      )}
    </div>
  );
}
