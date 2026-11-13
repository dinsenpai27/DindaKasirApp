import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface BarcodeSvgProps {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  className?: string;
}

export function BarcodeSvg({
  value,
  height = 42,
  width = 1.6,
  fontSize = 11,
  className = '',
}: BarcodeSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      const isEan13 = /^\d{13}$/.test(value);
      JsBarcode(svgRef.current, value, {
        format: isEan13 ? 'EAN13' : 'CODE128',
        width,
        height,
        displayValue: true,
        fontSize,
        margin: 4,
        background: '#ffffff',
        lineColor: '#0f172a',
      });
    } catch {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          fontSize,
          margin: 4,
          background: '#ffffff',
          lineColor: '#0f172a',
        });
      } catch {
        // ignore invalid barcode string
      }
    }
  }, [value, height, width, fontSize]);

  return <svg ref={svgRef} className={className} />;
}
