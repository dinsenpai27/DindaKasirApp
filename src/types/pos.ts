export type PageKey =
  | 'dashboard'
  | 'kasir'
  | 'products'
  | 'categories'
  | 'stock-in'
  | 'returns'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'roles'
  | 'swagger'
  | 'settings';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  productCount?: number;
  createdAt: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashierShift {
  id: number;
  userId: number;
  cashierName?: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  transactionCount?: number;
  cashSalesTotal?: number;
  nonCashSalesTotal?: number;
  status: 'OPEN' | 'CLOSED';
  notes: string;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  profit: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  shiftId: number | null;
  cashierId: number;
  cashierName?: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: 'COMPLETED' | 'VOID';
  notes: string;
  createdAt: string;
  items: SaleItem[];
}

export interface StockInRecord {
  id: number;
  referenceNo: string;
  productId: number;
  productName: string;
  barcode: string;
  unit: string;
  quantity: number;
  costPrice: number;
  supplierName: string;
  notes: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: number;
  returnNo: string;
  saleId: number | null;
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  returnType: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';
  userId: number;
  userName: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  notes: string;
  expenseDate: string;
  userId: number;
  userName?: string;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  userCount?: number;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRatePercent: number;
  receiptFooter: string;
  currency: string;
  invoicePrefix: string;
  updatedAt: string;
}

export interface DashboardSummary {
  lastSyncedAt: string;
  financialOverview: {
    grossProfit: number;
    grossMarginPercent: number;
    totalRevenue: number;
    totalCost: number;
    totalExpenses: number;
    netProfit: number;
    unitsSold: number;
    transactionCount: number;
  };
  outOfStock: {
    count: number;
    lowStockCount: number;
    items: Array<{
      id: number;
      name: string;
      sku: string;
      barcode: string;
      stock: number;
      minStock: number;
      costPrice: number;
      unit: string;
    }>;
  };
  productAnalytics: {
    range: { startDate: string; endDate: string };
    totalUnitsSold: number;
    totalProducts: number;
    page: number;
    limit: number;
    totalPages: number;
    items: Array<{
      productId: number;
      productName: string;
      barcode: string;
      volumeSold: number;
      revenue: number;
      profit: number;
      contributionPercent: number;
    }>;
  };
}

export interface FinancialReport {
  range: { startDate: string; endDate: string };
  summary: {
    transactionCount: number;
    totalRevenue: number;
    totalCost: number;
    totalDiscount: number;
    totalTax: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
  };
  paymentBreakdown: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
  }>;
  dailySeries: Array<{
    date: string;
    revenue: number;
    profit: number;
    expenses: number;
    transactions: number;
  }>;
}
