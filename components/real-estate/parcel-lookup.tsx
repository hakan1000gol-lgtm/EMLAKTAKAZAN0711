'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LocationPicker } from '@/components/real-estate/location-picker';
import { AdaParselPicker } from '@/components/real-estate/ada-parsel-picker';
import { parsePolygon } from '@/lib/real-estate/parcel-geometry';

const TurkeyMap = dynamic(() => import('@/components/real-estate/turkey-map').then((m) => m.TurkeyMap), {
  ssr: false,
  loading: () => <div className="flex h-72 items-center justify-center text-sm text-[#aaa9b6]">Harita yükleniyor...</div>,
});

interface ParcelInfo {
  nitelik?: string;
  alan?: string;
  adaNo?: string;
  parselNo?: string;
  mahalleAd?: string;
}

interface ParcelResult {
  city: string;
  district: string;
  neighborhood: string | null;
  ada: string | null;
  parsel: string | null;
  coordinates: { lat: number; lng: number } | null;
  geometry: string | null;
  displayName: string;
  source: string;
  query: string;
  note: string;
  parcelInfo: ParcelInfo | null;
}

export function ParcelLookup() {
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [ada, setAda] = useState('');
  const [parsel, setParsel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ParcelResult | null>(null);

  async function search() {
    if (!city || !district) {
      setError("İl ve ilçe seçin. Ada/parsel girerseniz konum TKGM'den bulunur.");
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('parcel-lookup', {
        body: { city, district, neighborhood: neighborhood || undefined, ada: ada || undefined, parsel: parsel || undefined },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setResult(data as ParcelResult);
    } catch {
      setError('Sorgu tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  const hasAdaParsel = Boolean(ada && parsel);
  const polygon = result ? parsePolygon(result.geometry) : null;

  return (
    <section className="relative my-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#171720] p-6 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-10">
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#3b82f6]/10 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3b82f6]/15 text-[#3b82f6]"><MapPin size={24} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffb21a]">TKGM Ada / Parsel sorgusu</p>
            <h2 className="mt-1 text-3xl font-bold text-white sm:text-4xl">Tapu konumunu bul</h2>
          </div>
        </div>

        <p className="mb-6 max-w-xl text-sm leading-7 text-[#a8a7b5]">
          İl ve ilçe seçin, dilerseniz mahalle seçip ada ve parsel numarasını girin. Ada/parsel girerseniz sistem TKGM resmi servisten parsel konumunu, sınırlarını ve niteliğini haritada gösterir. Sadece adres girerseniz konum yaklaşık olarak bulunur.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <LocationPicker
            onChange={() => {}}
            onPartsChange={(parts) => {
              setCity(parts.city);
              setDistrict(parts.district);
              setNeighborhood(parts.neighborhood);
              setAda('');
              setParsel('');
            }}
          />
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-[#20202c] p-3">
          <p className="mb-2 text-xs font-semibold text-[#aaa9b6]">Ada / Parsel <span className="text-[#555]">(isteğe bağlı)</span></p>
          <AdaParselPicker
            city={city}
            district={district}
            neighborhood={neighborhood}
            ada={ada}
            parsel={parsel}
            onAdaChange={setAda}
            onParselChange={setParsel}
            theme="dark"
          />
        </div>

        <button
          onClick={() => void search()}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3b82f6] py-4 text-sm font-bold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
        >
          {busy ? <><LoaderCircle size={18} className="animate-spin" /> Sorgulanıyor...</> : <><Search size={18} /> {hasAdaParsel ? "Parseli TKGM'den sorgula" : 'Konumu bul'}</>}
        </button>

        {error && <p className="mt-3 rounded-xl bg-[#4b202d] px-4 py-3 text-xs text-[#ffb5c5]">{error}</p>}

        {result && (
          <div className="mt-5 rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              {result.source === 'TKGM' ? (
                <span className="rounded-full bg-[#3b82f6] px-3 py-1 text-[10px] font-bold text-white">TKGM resmi konum</span>
              ) : (
                <span className="rounded-full bg-[#6b7280] px-3 py-1 text-[10px] font-bold text-white">Yaklaşık konum</span>
              )}
              {result.ada && result.parsel && (
                <span className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-semibold text-[#c8c6d0]">Ada {result.ada} · Parsel {result.parsel}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-[#c8c6d0] sm:grid-cols-4">
              <span className="rounded-xl bg-black/20 p-3"><b className="block text-base text-white">{result.city}</b>İl</span>
              <span className="rounded-xl bg-black/20 p-3"><b className="block text-base text-white">{result.district}</b>İlçe</span>
              {result.ada && <span className="rounded-xl bg-black/20 p-3"><b className="block text-base text-white">{result.ada}</b>Ada</span>}
              {result.parsel && <span className="rounded-xl bg-black/20 p-3"><b className="block text-base text-white">{result.parsel}</b>Parsel</span>}
            </div>

            {result.neighborhood && (
              <p className="mt-3 text-xs text-[#c8c6d0]"><span className="font-semibold">Mahalle:</span> {result.neighborhood}</p>
            )}

            {result.parcelInfo?.nitelik && (
              <p className="mt-1 text-xs text-[#c8c6d0]"><span className="font-semibold">Nitelik:</span> {result.parcelInfo.nitelik}</p>
            )}

            {result.parcelInfo?.alan && (
              <p className="mt-1 text-xs text-[#c8c6d0]"><span className="font-semibold">Alan:</span> {result.parcelInfo.alan} m²</p>
            )}

            {result.displayName && (
              <p className="mt-2 text-xs leading-5 text-[#c8c6d0]"><span className="font-semibold">Adres:</span> {result.displayName}</p>
            )}

            {result.coordinates ? (
              <>
                <p className="mt-3 text-xs text-[#7ee787]">Konum bulundu: {result.coordinates.lat.toFixed(6)}, {result.coordinates.lng.toFixed(6)}</p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                  <div className="h-[320px] w-full">
                    <TurkeyMap
                      latitude={result.coordinates.lat}
                      longitude={result.coordinates.lng}
                      onPick={() => {}}
                      markerType={hasAdaParsel ? 'parcel' : 'default'}
                      polygon={polygon}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-xs text-[#ffb5c5]">Belirtilen bilgiler için konum bulunamadı.</p>
            )}

            <p className="mt-3 rounded-xl bg-[#ffb21a]/10 px-3 py-2 text-[10px] leading-4 text-[#ffb21a]">{result.note}</p>
          </div>
        )}
      </div>
    </section>
  );
}
