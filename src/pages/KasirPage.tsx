import {
  Barcode,
  Camera,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarcodeSvg } from '../components/BarcodeSvg.tsx';
import { CameraBarcodeModal } from '../components/CameraBarcodeModal.tsx';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { api } from '../lib/api.ts';
import { formatRupiah, playScannerBeep } from '../lib/format.ts';
import type {
  CashierShift,
  Category,
  PaymentMethod,
  Product,
  Sale,
  StoreSettings,
  User,
} from '../types/pos.ts';

interface KasirPageProps {
  activeUser: User | null;
  currentShift: CashierShift | null;
  onOpenShiftModal: () => void;
  settings: StoreSettings | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function KasirPage({
  activeUser,
  currentShift,
  onOpenShiftModal,
  settings,
}: KasirPageProps) {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  const [cameraOpen, setCameraOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const loadCatalog = useCallback(async () => {
    const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
    setProducts(prods);
    setCategories(cats);
  }, []);

  useEffect(() => {
    void loadCatalog();
    barcodeInputRef.current?.focus();
  }, [loadCatalog]);

  const addProductToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      setScanFeedback({ type: 'err', text: `Stok "${product.name}" habis (0).` });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setScanFeedback({
            type: 'err',
            text: `Maksimal stok "${product.name}" adalah ${product.stock} ${product.unit}.`,
          });
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setScanFeedback({
      type: 'ok',
      text: `Ditambahkan: ${product.name} (${product.barcode})`,
    });
  }, []);

  const handleBarcodeLookup = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;
      try {
        const product = await api.lookupBarcode(code);
        playScannerBeep();
        addProductToCart(product);
      } catch (err) {
        setScanFeedback({
          type: 'err',
          text: err instanceof Error ? err.message : `Barcode "${code}" tidak ditemukan.`,
        });
      }
    },
    [addProductToCart],
  );

  const handleBarcodeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;
    setBarcodeInput('');
    await handleBarcodeLookup(code);
    barcodeInputRef.current?.focus();
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== productId) return c;
          const nextQty = c.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > c.product.stock) {
            setScanFeedback({
              type: 'err',
              text: `Stok "${c.product.name}" hanya tersisa ${c.product.stock}.`,
            });
            return c;
          }
          return { ...c, quantity: nextQty };
        })
        .filter((x): x is CartItem => x !== null),
    );
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.sellPrice * c.quantity, 0);
  const discountNum = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const afterDiscount = Math.max(0, subtotal - discountNum);
  const taxRate = settings?.taxRatePercent || 0;
  const taxAmount = Math.round((afterDiscount * taxRate) / 100);
  const grandTotal = afterDiscount + taxAmount;
  const paidNum = paymentMethod === 'CASH' ? Number(amountPaid) || 0 : grandTotal;
  const changeAmount = Math.max(0, paidNum - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && paidNum < grandTotal) {
      setScanFeedback({ type: 'err', text: 'Nominal bayar tunai masih kurang dari total.' });
      return;
    }

    setSubmitting(true);
    try {
      const sale = await api.createSale({
        cashierId: activeUser?.id || 1,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        discount: discountNum,
        paymentMethod,
        amountPaid: paidNum,
        notes,
      });

      setCompletedSale(sale);
      setCart([]);
      setDiscount('0');
      setAmountPaid('');
      setNotes('');
      setScanFeedback({ type: 'ok', text: `Transaksi ${sale.invoiceNumber} berhasil disimpan.` });
      await loadCatalog();
    } catch (err) {
      setScanFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal memproses transaksi.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Shift Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kasir &amp; Scan Barcode
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan via scanner USB, kamera perangkat, atau pilih barang langsung dari katalog.
          </p>
        </div>

        {!currentShift && (
          <button
            type="button"
            onClick={onOpenShiftModal}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
          >
            Shift kasir belum dibuka — Klik untuk Buka Kasir
          </button>
        )}
      </div>

      {/* Main Split POS Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Barcode Scanner + Catalog */}
        <div className="space-y-4 lg:col-span-7 xl:col-span-8">
          {/* Barcode Scanner Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <form onSubmit={handleBarcodeFormSubmit} className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px] flex-1">
                <Barcode className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-teal-700 dark:text-teal-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode USB / ketik kode EAN-13 atau SKU lalu Enter..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/70 py-2.5 pr-3 pl-10 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Scan Kode
              </button>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-teal-800"
              >
                <Camera className="h-4 w-4" />
                <span>Scan Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatorOpen((prev) => !prev)}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Tes Barcode</span>
              </button>
            </form>

            {scanFeedback && (
              <div
                className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                  scanFeedback.type === 'ok'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {scanFeedback.text}
                </span>
                <button type="button" onClick={() => setScanFeedback(null)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {simulatorOpen && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>Klik salah satu label barcode untuk simulasi scan via API:</span>
                  <button type="button" onClick={() => setSimulatorOpen(false)} className="text-slate-400 hover:text-slate-700">
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void handleBarcodeLookup(p.barcode)}
                      className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-2 text-center transition-colors hover:border-teal-600 dark:border-slate-700"
                    >
                      <span className="mb-1 line-clamp-1 text-[11px] font-medium text-slate-800">
                        {p.name}
                      </span>
                      <BarcodeSvg value={p.barcode} height={28} width={1.1} fontSize={9} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('ALL')}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategoryId === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-teal-700'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-slate-900 text-white dark:bg-teal-700'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative min-w-[180px] flex-1 sm:max-w-[220px]">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter barang..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const out = product.stock <= 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    playScannerBeep();
                    addProductToCart(product);
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-colors ${
                    out
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                      : 'border-slate-200 bg-white hover:border-teal-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="truncate">{product.categoryName}</span>
                      <span
                        className={`font-mono font-medium tabular-nums ${
                          out
                            ? 'text-rose-600'
                            : product.stock <= product.minStock
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        }`}
                      >
                        Stok: {product.stock}
                      </span>
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {product.name}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-400">{product.barcode}</div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <span className="font-mono text-sm font-bold tabular-nums text-teal-700 dark:text-teal-400">
                      {formatRupiah(product.sellPrice, false)}
                    </span>
                    <span className="text-[11px] text-slate-400">/{product.unit}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Payment Panel */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Keranjang Belanja
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="max-h-[300px] divide-y divide-slate-100 overflow-y-auto px-4 dark:divide-slate-800">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Keranjang kosong. Scan barcode atau klik produk di sebelah kiri.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {product.name}
                      </div>
                      <div className="font-mono text-[11px] tabular-nums text-slate-500">
                        {formatRupiah(product.sellPrice, false)} x {quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, -1)}
                        className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs font-semibold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, 1)}
                        className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, -quantity)}
                        className="ml-1 rounded p-1 text-slate-400 hover:text-rose-600"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Payment */}
            <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatRupiah(subtotal, false)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-400">
                  <span>Diskon (Rp)</span>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Pajak ({taxRate}%)</span>
                    <span className="font-mono tabular-nums">{formatRupiah(taxAmount, false)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                  <span>Total Tagihan</span>
                  <span className="font-mono tabular-nums text-teal-700 dark:text-teal-400">
                    {formatRupiah(grandTotal, false)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-slate-500 uppercase">
                  Metode Pembayaran
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'CASH', label: 'Tunai', icon: Wallet },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                      { id: 'DEBIT', label: 'Debit', icon: CreditCard },
                    ] as const
                  ).map((pm) => {
                    const Icon = pm.icon;
                    const active = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] font-medium transition-colors ${
                          active
                            ? 'border-teal-700 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-300'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Uang Diterima
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder={String(grandTotal)}
                      className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAmountPaid(String(grandTotal))}
                      className="rounded border border-slate-200 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmountPaid(String(v))}
                        className="rounded border border-slate-200 py-1 font-mono text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        {v / 1000}rb
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Kembalian</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatRupiah(changeAmount, false)}
                    </span>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan transaksi (opsional)..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <button
                type="button"
                disabled={cart.length === 0 || submitting}
                onClick={handleCheckout}
                className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Memproses Pembayaran...' : `Bayar · ${formatRupiah(grandTotal, false)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CameraBarcodeModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetected={handleBarcodeLookup}
      />

      <ReceiptModal
        sale={completedSale}
        settings={settings}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
}
