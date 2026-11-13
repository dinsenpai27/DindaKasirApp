export interface RoleEntity {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

export interface UserEntity {
  id: number;
  name: string;
  email: string;
  pin: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryEntity {
  id: number;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export interface ProductEntity {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  categoryId: number;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashierShiftEntity {
  id: number;
  userId: number;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  status: 'OPEN' | 'CLOSED';
  notes: string;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';

export interface SaleItemEntity {
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

export interface SaleEntity {
  id: number;
  invoiceNumber: string;
  shiftId: number | null;
  cashierId: number;
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
}

export interface StockInEntity {
  id: number;
  referenceNo: string;
  productId: number;
  quantity: number;
  costPrice: number;
  supplierName: string;
  notes: string;
  userId: number;
  createdAt: string;
}

export interface ReturnEntity {
  id: number;
  returnNo: string;
  saleId: number | null;
  productId: number;
  quantity: number;
  refundAmount: number;
  reason: string;
  returnType: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';
  userId: number;
  createdAt: string;
}

export interface ExpenseEntity {
  id: number;
  title: string;
  category: string;
  amount: number;
  notes: string;
  expenseDate: string;
  userId: number;
  createdAt: string;
}

export interface StoreSettingsEntity {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRatePercent: number;
  receiptFooter: string;
  currency: string;
  invoicePrefix: string;
  updatedAt: string;
}

export interface PosDatabaseSchema {
  sequences: {
    roles: number;
    users: number;
    categories: number;
    products: number;
    shifts: number;
    sales: number;
    saleItems: number;
    stockIns: number;
    returns: number;
    expenses: number;
  };
  roles: RoleEntity[];
  users: UserEntity[];
  categories: CategoryEntity[];
  products: ProductEntity[];
  shifts: CashierShiftEntity[];
  sales: SaleEntity[];
  saleItems: SaleItemEntity[];
  stockIns: StockInEntity[];
  returns: ReturnEntity[];
  expenses: ExpenseEntity[];
  settings: StoreSettingsEntity;
}
