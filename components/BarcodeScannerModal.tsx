"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Skanner bokens strekkode (EAN-13 = ISBN-13) med kameraet, via nettleserens
 * BarcodeDetector-API (Chrome/Edge/Android og nyere Safari). Nettlesere uten
 * støtte får beskjed om å skrive inn ISBN manuelt.
 */

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: {
      formats: string[];
    }) => BarcodeDetectorInstance;
  }
}

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(() =>
    typeof window === "undefined" || window.BarcodeDetector
      ? null
      : "Nettleseren din støtter ikke strekkodeskanning. Skriv inn ISBN-nummeret (13 siffer over strekkoden) manuelt i stedet."
  );

  useEffect(() => {
    if (!window.BarcodeDetector) return;

    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8"],
    });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        void video.play();

        timer = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            // EAN-13 (bøker, filmer, plater) eller EAN-8
            const isbn = codes.find((c) =>
              /^(\d{13}|\d{8})$/.test(c.rawValue)
            )?.rawValue;
            if (isbn) {
              if (timer) clearInterval(timer);
              stream?.getTracks().forEach((t) => t.stop());
              onDetected(isbn);
            }
          } catch {
            // Enkeltbilder kan feile – prøv igjen på neste tick.
          }
        }, 250);
      })
      .catch(() => {
        setError(
          "Fikk ikke tilgang til kameraet. Gi tillatelse i nettleseren, eller skriv inn ISBN manuelt."
        );
      });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-dark">
            Skann strekkoden
          </h2>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="rounded-full px-3 py-1 text-muted hover:bg-brand-light"
          >
            ✕
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
            {error}
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Hold strekkoden på baksiden av boken foran kameraet.
            </p>
            <video
              ref={videoRef}
              className="mt-4 aspect-[4/3] w-full rounded-xl bg-black object-cover"
              muted
              playsInline
            />
          </>
        )}
      </div>
    </div>
  );
}
