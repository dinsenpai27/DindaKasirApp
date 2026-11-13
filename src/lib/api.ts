import type {
  CashierShift,
  Category,
  DashboardSummary,
  Expense,
  FinancialReport,
  PaymentMethod,
  Product,
  ReturnRecord,
  Role,
  Sale,
  StockInRecord,
  StoreSettings,
  User,
} from '../types/pos.ts';

let authToken: string | null =
  typeof window !== 'undefined' ? window.sessionStorage.getItem('kasirku_token') : null;

let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem('kasirku_token', token);
    } else {
      window.sessionStorage.removeItem('kasirku_token');
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && !url.includes('/api/auth/login')) {
    setAuthToken(null);
    unauthorizedHandler?.();
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (Array.isArray(body?.message)) {
        message = body.message.join(', ');
      } else if (body?.message) {
        message = body.message;
      } else if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text.trim()) {
    return null as T;
  }
  return JSON.parse(text) as T;
}

export const api = {
  // Auth
  login: (email: string, pin: string) =>
    request<{ accessToken: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, pin }),
    }),
  getMe: () => request<User>('/api/auth/me'),

  // Dashboard
  getDashboardSummary: (params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params.period) sp.set('period', params.period);
    if (params.startDate) sp.set('startDate', params.startDate);
    if (params.endDate) sp.set('endDate', params.endDate);
    if (params.search) sp.set('search', params.search);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    return request<DashboardSummary>(`/api/dashboard/summary?${sp.toString()}`);
  },

  // Products & Categories
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  importCategories: (items: Array<{ name: string; description?: string }>, mode: 'skip' | 'upsert' = 'upsert') =>
    request<{ createdCount: number; updatedCount: number; skippedCount: number; errors: string[] }>(
      '/api/categories/import',
      { method: 'POST', body: JSON.stringify({ items, mode }) },
    ),
  updateCategory: (id: number, data: { name?: string; description?: string }) =>
    request<Category>(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request<{ deleted: boolean }>(`/api/categories/${id}`, { method: 'DELETE' }),

  getProducts: (params?: { search?: string; categoryId?: number; stockStatus?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search);
    if (params?.categoryId) sp.set('categoryId', String(params.categoryId));
    if (params?.stockStatus) sp.set('stockStatus', params.stockStatus);
    return request<Product[]>(`/api/products?${sp.toString()}`);
  },
  lookupBarcode: (barcode: string) => request<Product>(`/api/products/barcode/${encodeURIComponent(barcode)}`),
  createProduct: (data: {
    sku?: string;
    barcode?: string;
    name: string;
    categoryId: number;
    costPrice: number;
    sellPrice: number;
    stock: number;
    minStock?: number;
    unit?: string;
  }) => request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  importProducts: (
    items: Array<{
      sku?: string;
      barcode?: string;
      name: string;
      categoryName?: string;
      costPrice: number;
      sellPrice: number;
      stock: number;
      minStock?: number;
      unit?: string;
    }>,
    mode: 'skip' | 'upsert' = 'upsert',
  ) =>
    request<{
      createdCount: number;
      updatedCount: number;
      skippedCount: number;
      autoCreatedCategories: string[];
      errors: string[];
    }>('/api/products/import', { method: 'POST', body: JSON.stringify({ items, mode }) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request<{ deleted: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),

  // Shifts & Sales
  getCurrentShift: () => request<CashierShift | null>('/api/shifts/current'),
  getShifts: () => request<CashierShift[]>('/api/shifts'),
  openShift: (data: { userId: number; openingCash: number; notes?: string }) =>
    request<CashierShift>('/api/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (data: { closingCash: number; notes?: string }) =>
    request<CashierShift>('/api/shifts/close', { method: 'POST', body: JSON.stringify(data) }),

  getSales: (params?: { startDate?: string; endDate?: string; paymentMethod?: string; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.startDate) sp.set('startDate', params.startDate);
    if (params?.endDate) sp.set('endDate', params.endDate);
    if (params?.paymentMethod) sp.set('paymentMethod', params.paymentMethod);
    if (params?.search) sp.set('search', params.search);
    return request<Sale[]>(`/api/sales?${sp.toString()}`);
  },
  createSale: (data: {
    cashierId: number;
    items: Array<{ productId: number; quantity: number }>;
    discount?: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => request<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  voidSale: (id: number) => request<Sale>(`/api/sales/${id}/void`, { method: 'POST' }),

  // Inventory (Stock In & Returns)
  getStockIns: () => request<StockInRecord[]>('/api/stock-ins'),
  createStockIn: (data: {
    productId: number;
    quantity: number;
    costPrice: number;
    supplierName: string;
    notes?: string;
    userId?: number;
  }) => request<StockInRecord>('/api/stock-ins', { method: 'POST', body: JSON.stringify(data) }),

  getReturns: () => request<ReturnRecord[]>('/api/returns'),
  createReturn: (data: {
    saleId?: number | null;
    productId: number;
    quantity: number;
    refundAmount: number;
    reason: string;
    returnType: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';
    userId?: number;
  }) => request<ReturnRecord>('/api/returns', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses & Reports
  getExpenses: () => request<Expense[]>('/api/expenses'),
  createExpense: (data: {
    title: string;
    category: string;
    amount: number;
    notes?: string;
    expenseDate?: string;
    userId?: number;
  }) => request<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id: number) => request<{ deleted: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }),

  getFinancialReport: (startDate?: string, endDate?: string) => {
    const sp = new URLSearchParams();
    if (startDate) sp.set('startDate', startDate);
    if (endDate) sp.set('endDate', endDate);
    return request<FinancialReport>(`/api/reports/financial?${sp.toString()}`);
  },

  // System
  getUsers: () => request<User[]>('/api/users'),
  createUser: (data: { name: string; email: string; pin: string; roleId: number }) =>
    request<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<User & { pin?: string }>) =>
    request<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request<{ deleted: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),

  getRoles: () => request<Role[]>('/api/roles'),
  createRole: (data: { name: string; description?: string; permissions: string[] }) =>
    request<Role>('/api/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: number, data: { name?: string; description?: string; permissions?: string[] }) =>
    request<Role>(`/api/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRole: (id: number) => request<{ deleted: boolean }>(`/api/roles/${id}`, { method: 'DELETE' }),

  getSettings: () => request<StoreSettings>('/api/settings'),
  updateSettings: (data: Partial<StoreSettings>) =>
    request<StoreSettings>('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  getPostgresSchemaSql: () => request<{ sql: string }>('/api/system/schema-sql'),
};