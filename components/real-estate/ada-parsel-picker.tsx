'use client';

import { useState } from 'react';
import { MapPin, Search, LoaderCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Theme = 'light' | 'dark';

interface ParcelVerifyResult {
  verified: boolean;
  source: string;
  nitelik?: string;
  alan?: string;
  adaNo?: string;
  parselNo?: string;
  mahalleAd?: string;
  error?: string;
}

interface AdaParselPickerProps {
  city: string;
  district: string;
  neighborhood: string;
  onAdaChange: (ada: string) => void;
  onParselChange: (parsel: string) => void;
  onVerified?: (info: { alan?: string; nitelik?: string }) => void;
  ada: string;
  parsel: string;
  theme?: Theme;
}

export function AdaParselPicker({
  city, district, neighborhood, ada, parsel,
  onAdaChange, onParselChange, onVerified, theme = 'light',
}: AdaParselPickerProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ParcelVerifyResult | null>(null);

  const dark = theme === 'dark';
  const labelClass = dark ? 'text-[#aaa9b6]' : 'text-[#6a746c]';
  const inputClass = dark
    ? 'mt-1 w-full rounded-xl border border-white/10 bg-[#20202c] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]'
    : 'mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#3b82f6]';
  const hintClass = dark ? 'text-[#555]' : 'text-[#999]';
  const successClass = dark ? 'text-[#7ee787]' : 'text-[#2f7d5b]';
  const errorClass = dark ? 'text-[#ffb5c5]' : 'text-[#b42345]';
  const canVerify = Boolean(city && district && neighborhood && ada && parsel);

  async function verifyParcel() {
    if (!canVerify) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('parcel-lookup', {
        body: { city, district, neighborhood, ada, parsel },
      });
      if (error || data?.error) {
        setVerifyResult({ verified: false, source: '', error: 'Parsel doğrulanamadı.' });
      } else {
        const r = data as { source: string; parcelInfo?: Record<string, string> | null; coordinates: { lat: number; lng: number } | null };
        setVerifyResult({
          verified: Boolean(r.coordinates),
          source: r.source,
          nitelik: r.parcelInfo?.nitelik,
          alan: r.parcelInfo?.alan,
          adaNo: r.parcelInfo?.adaNo,
          parselNo: r.parcelInfo?.parselNo,
          mahalleAd: r.parcelInfo?.mahalleAd,
          error: r.coordinates ? undefined : 'Parsel TKGM veritabanında bulunamadı.',
        });
        if (r.coordinates) onVerified?.({ alan: r.parcelInfo?.alan, nitelik: r.parcelInfo?.nitelik });
      }
    } catch {
      setVerifyResult({ verified: false, source: '', error: 'Sorgu sırasında hata oluştu.' });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className={`block text-[11px] font-semibold ${labelClass}`}>
          Ada <span className={hintClass}>(isteğe bağlı)</span>
          <input
            value={ada}
            onChange={(e) => { onAdaChange(e.target.value); setVerifyResult(null); }}
            type="number"
            min="1"
            className={inputClass}
            placeholder="Örn: 1234"
          />
        </label>
        <label className={`block text-[11px] font-semibold ${labelClass}`}>
          Parsel <span className={hintClass}>(isteğe bağlı)</span>
          <input
            value={parsel}
            onChange={(e) => { onParselChange(e.target.value); setVerifyResult(null); }}
            type="number"
            min="1"
            className={inputClass}
            placeholder="Örn: 567"
          />
        </label>
      </div>

      {canVerify && (
        <button
          type="button"
          onClick={() => void verifyParcel()}
          disabled={verifying}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${dark ? 'bg-white/10 text-[#7ee787] hover:bg-white/15' : 'bg-[#e2eee1] text-[#2f7d5b] hover:bg-[#d4e8d3]'}`}
        >
          {verifying ? <><LoaderCircle size={12} className="animate-spin" /> TKGM'de doğrulanıyor...</> : <><Search size={12} /> TKGM'de doğrula</>}
        </button>
      )}

      {verifyResult && (
        <div className={`rounded-lg px-2.5 py-2 text-[10px] leading-4 ${verifyResult.verified ? (dark ? 'bg-[#1a3a1a]/40' : 'bg-[#e8f5e9]') : (dark ? 'bg-[#3a1a22]/40' : 'bg-[#fce4ec]')}`}>
          {verifyResult.verified ? (
            <div className={successClass}>
              <span className="font-bold">TKGM'de bulundu</span>
              {verifyResult.nitelik && <span> · {verifyResult.nitelik}</span>}
              {verifyResult.alan && <span> · {verifyResult.alan} m²</span>}
              {verifyResult.mahalleAd && verifyResult.mahalleAd !== neighborhood && <div>Mahalle: {verifyResult.mahalleAd}</div>}
            </div>
          ) : (
            <div className={errorClass}>{verifyResult.error}</div>
          )}
        </div>
      )}

      {!neighborhood && ada && (
        <p className={`text-[10px] ${hintClass}`}>Ada/parsel TKGM'de doğrulamak için mahalle seçin.</p>
      )}
    </div>
  );
}
