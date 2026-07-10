import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
}

export default function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (scanning && scannerRef.current) {
      scanner = new Html5QrcodeScanner(
        "barcode-scanner",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onResult(decodedText);
          setScanning(false);
          if (scanner) {
            scanner.clear().catch(console.error);
          }
        },
        (errorMessage) => {
          // ignore scan errors, they happen on every frame
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning, onResult]);

  return (
    <div className="w-full">
      {!scanning ? (
        <button 
          onClick={() => setScanning(true)}
          className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold py-3 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M16 7v10"/></svg>
          SCAN BARCODE / QR CODE
        </button>
      ) : (
        <div className="w-full">
          <div id="barcode-scanner" ref={scannerRef}></div>
          <button 
            onClick={() => setScanning(false)}
            className="w-full mt-2 bg-slate-100 text-slate-600 font-semibold py-2 rounded-lg hover:bg-slate-200 transition"
          >
            Cancel Scan
          </button>
        </div>
      )}
    </div>
  );
}
