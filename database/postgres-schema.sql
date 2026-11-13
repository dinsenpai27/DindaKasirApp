-- KasirKu POS - PostgreSQL Database Schema (Production DDL Reference)
-- Compatible with PostgreSQL 15+

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  pin VARCHAR(16) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  barcode VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  unit VARCHAR(32) NOT NULL DEFAULT 'pcs',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);

CREATE TABLE cashier_shifts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(14, 2),
  expected_cash NUMERIC(14, 2),
  status VARCHAR(16) NOT NULL CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
  notes TEXT
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(64) NOT NULL UNIQUE,
  shift_id INTEGER REFERENCES cashier_shifts(id) ON DELETE SET NULL,
  cashier_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gross_profit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(24) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS', 'TRANSFER', 'DEBIT')),
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL CHECK (status IN ('COMPLETED', 'VOID')) DEFAULT 'COMPLETED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_invoice ON sales(invoice_number);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(180) NOT NULL,
  barcode VARCHAR(64) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL,
  unit_cost NUMERIC(14, 2) NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL,
  profit NUMERIC(14, 2) NOT NULL
);

CREATE TABLE stock_ins (
  id SERIAL PRIMARY KEY,
  reference_no VARCHAR(64) NOT NULL UNIQUE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cost_price NUMERIC(14, 2) NOT NULL,
  supplier_name VARCHAR(160) NOT NULL,
  notes TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_returns (
  id SERIAL PRIMARY KEY,
  return_no VARCHAR(64) NOT NULL UNIQUE,
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  refund_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  return_type VARCHAR(24) NOT NULL CHECK (return_type IN ('CUSTOMER_RETURN', 'SUPPLIER_RETURN')),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name VARCHAR(160) NOT NULL DEFAULT 'KasirKu Store',
  store_address TEXT NOT NULL DEFAULT '',
  store_phone VARCHAR(40) NOT NULL DEFAULT '',
  tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  receipt_footer TEXT NOT NULL DEFAULT 'Terima kasih telah berbelanja!',
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  invoice_prefix VARCHAR(16) NOT NULL DEFAULT 'INV',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
