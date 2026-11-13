import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Camera, CheckCircle2, ScanLine, X, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { playScannerBeep } from '../lib/format.ts';

interface CameraBarcodeModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => Promise<void> | void;
}

export function CameraBarcodeModal({ open, onClose, onDetected }: CameraBarcodeModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Menginisialisasi kamera...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!open) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    async function startCamera() {
      try {
        setErrorMessage(null);
        setStatusMessage('Meminta izin akses kamera...');
        const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;

        setDevices(videoDevices);
        if (videoDevices.length === 0) {
          setErrorMessage('Tidak ada kamera terdeteksi di perangkat ini. Anda tetap dapat memasukkan barcode secara manual di bawah.');
          setStatusMessage('Kamera tidak tersedia');
          return;
        }

        const preferred =
          selectedDeviceId ||
          videoDevices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          videoDevices[0].deviceId;

        if (!selectedDeviceId) {
          setSelectedDeviceId(preferred);
        }

        if (!videoRef.current) return;
        setStatusMessage('Arahkan kamera ke barcode produk (EAN-13, Code-128, QR)...');

        const controls = await reader.decodeFromVideoDevice(
          preferred,
          videoRef.current,
          (result) => {
            if (!result) return;
            const code = result.getText().trim();
            const now = Date.now();
            if (code === lastScannedRef.current.code && now - lastScannedRef.current.time < 1600) {
              return;
            }
            lastScannedRef.current = { code, time: now };
            setLastCode(code);
            playScannerBeep();
            void onDetected(code);
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Gagal mengakses kamera.';
          setErrorMessage(`Akses kamera tidak tersedia (${msg}). Gunakan scanner USB atau input manual di bawah.`);
          setStatusMessage('Kamera tidak aktif');
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, selectedDeviceId, onDetected]);

  if (!open) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    playScannerBeep();
    setLastCode(trimmed);
    await onDetected(trimmed);
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Camera className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Scan Barcode Kamera
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mendukung EAN-13, EAN-8, UPC, Code-128 &amp; QR Code
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Tutup scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {devices.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Kamera:</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-800">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {!errorMessage && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-36 w-64 rounded-lg border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.38)]">
                  <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-rose-500/80" />
                </div>
              </div>
            )}
            {errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/95 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-amber-400" />
                <p className="text-xs leading-relaxed text-slate-200">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs dark:bg-slate-800/70">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <ScanLine className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              <span>{statusMessage}</span>
            </div>
            {lastCode && (
              <span className="flex items-center gap-1 font-mono font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lastCode}
              </span>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Atau ketik kode barcode manual (mis. 8991002101012)..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="shrink-0 whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
            >
              Tambah
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
