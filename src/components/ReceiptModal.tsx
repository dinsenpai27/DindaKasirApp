import { Printer, X } from 'lucide-react';
import { formatDateTime, formatRupiah } from '../lib/format.ts';
import type { Sale, StoreSettings } from '../types/pos.ts';
import { BarcodeSvg } from './BarcodeSvg.tsx';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: StoreSettings | null;
  onClose: () => void;
}

export function ReceiptModal({ sale, settings, onClose }: ReceiptModalProps) {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 print:hidden">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Struk Pembayaran
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5 font-mono text-xs text-slate-800 dark:text-slate-200">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {settings?.storeName || 'IR Beauty Store'}
            </div>
            {settings?.storeAddress && (
              <div className="mt-0.5 text-[11px] text-slate-500">{settings.storeAddress}</div>
            )}
            {settings?.storePhone && (
              <div className="text-[11px] text-slate-500">Telp: {settings.storePhone}</div>
            )}
          </div>

          <div className="border-y border-dashed border-slate-300 py-2 text-[11px] dark:border-slate-700">
            <div className="flex justify-between">
              <span>No. Struk</span>
              <span className="font-semibold">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{sale.cashierName || 'Administrator'}</span>
            </div>
            <div className="flex justify-between">
              <span>Pembayaran</span>
              <span>{sale.paymentMethod}</span>
            </div>
          </div>

          <div className="space-y-2">
            {sale.items.map((item) => (
              <div key={item.id}>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>
                    {item.quantity} x {formatRupiah(item.unitPrice, false)}
                  </span>
                  <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {formatRupiah(item.subtotal, false)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-dashed border-slate-300 pt-2 text-[11px] dark:border-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRupiah(sale.subtotal, false)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRupiah(sale.discount, false)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <span>Pajak</span>
                <span className="tabular-nums">{formatRupiah(sale.tax, false)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-xs font-bold text-slate-900 dark:text-white">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatRupiah(sale.totalAmount, false)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar</span>
              <span className="tabular-nums">{formatRupiah(sale.amountPaid, false)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span className="tabular-nums">{formatRupiah(sale.changeAmount, false)}</span>
            </div>
          </div>

          <div className="flex flex-col items-center border-t border-dashed border-slate-300 pt-3 text-center dark:border-slate-700">
            <div className="rounded bg-white p-1">
              <BarcodeSvg value={sale.invoiceNumber} height={28} width={1.1} fontSize={9} />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {settings?.receiptFooter || 'Terima kasih telah berbelanja!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
