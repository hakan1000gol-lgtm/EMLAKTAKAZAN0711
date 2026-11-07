'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { LocationPicker } from '@/components/real-estate/location-picker';
import { AdaParselPicker } from '@/components/real-estate/ada-parsel-picker';
import { supabase } from '@/lib/supabase/client';
import { parsePolygon, type ParcelPoint } from '@/lib/real-estate/parcel-geometry';

const TurkeyMap = dynamic(() => import('@/components/real-estate/turkey-map').then((m) => m.TurkeyMap), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-xs text-[#849087]">Harita yükleniyor...</div>,
});

interface ParcelResult {
  coordinates: { lat: number; lng: number } | null;
  displayName: string;
  city: string;
  district: string;
  neighborhood: string | null;
  ada: string | null;
  parsel: string | null;
  geometry: string | null;
  source: string;
  note: string;
}

type LocationParts = { city: string; district: string; neighborhood: string };

export function AddressSection({
  initialCity,
  initialDistrict,
  initialNeighborhood,
  initialAda,
  initialParsel,
  onLocationChange,
  onAdaParselChange,
  onCoordinatesFound,
  onParcelGeometryChange,
  onParcelVerified,
  title = 'Adres ve konum',
  variant = 'light',
}: {
  initialCity?: string;
  initialDistrict?: string;
  initialNeighborhood?: string;
  initialAda?: string;
  initialParsel?: string;
  onLocationChange: (parts: LocationParts) => void;
  onAdaParselChange?: (ada: string, parsel: string) => void;
  onCoordinatesFound?: (lat: number, lng: number, source: string) => void;
  onParcelGeometryChange?: (geometry: string | null) => void;
  onParcelVerified?: (info: { alan?: string; nitelik?: string }) => void;
  title?: string;
  variant?: 'light' | 'dark';
}) {
  const [ada, setAda] = useState(initialAda ?? '');
  const [parsel, setParsel] = useState(initialParsel ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState(false);
  const [foundSource, setFoundSource] = useState('');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLabel, setMapLabel] = useState('');
  const [polygon, setPolygon] = useState<ParcelPoint[] | null>(null);
  const [parts, setParts] = useState<LocationParts>({
    city: initialCity ?? '',
    district: initialDistrict ?? '',
    neighborhood: initialNeighborhood ?? '',
  });

  const dark = variant === 'dark';
  const cardClass = dark
    ? 'rounded-2xl border border-white/10 bg-white/5 p-4'
    : 'rounded-2xl border border-black/10 bg-[#f0f5ef] p-4';
  const labelClass = dark ? 'text-[#aaa9b6]' : 'text-[#6a746c]';
  const headerClass = dark ? 'text-[#c8c6d0]' : 'text-[#526257]';
  const dividerClass = dark ? 'border-white/10' : 'border-black/5';
  const successClass = dark ? 'text-[#7ee787]' : 'text-[#2f7d5b]';
  const errorClass = dark ? 'text-[#ffb5c5]' : 'text-[#b42345]';

  function handleLocation(newParts: LocationParts) {
    setParts(newParts);
    setAda('');
    setParsel('');
    clearParcel();
    onLocationChange(newParts);
    onAdaParselChange?.('', '');
  }

  function clearParcel() {
    setPolygon(null);
    setMapCoords(null);
    setFound(false);
    onParcelGeometryChange?.(null);
  }

  function handleAdaChange(value: string) {
    setAda(value);
    clearParcel();
    onAdaParselChange?.(value, parsel);
  }

  function handleParselChange(value: string) {
    setParsel(value);
    clearParcel();
    onAdaParselChange?.(ada, value);
  }

  async function searchParcel() {
    if (!parts.city || !parts.district) {
      setError("İl ve ilçe seçin. Ada/parsel girerseniz konum TKGM'den bulunur.");
      return;
    }
    setBusy(true);
    setError('');
    setFound(false);
    setFoundSource('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('parcel-lookup', {
        body: {
          city: parts.city,
          district: parts.district,
          neighborhood: parts.neighborhood || undefined,
          ada: ada || undefined,
          parsel: parsel || undefined,
        },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const result = data as ParcelResult;
      if (result.coordinates) {
        setFound(true);
        setFoundSource(result.source || 'OpenStreetMap');
        onCoordinatesFound?.(result.coordinates.lat, result.coordinates.lng, result.source || 'OpenStreetMap');
        const labelParts = [
          result.neighborhood || parts.neighborhood,
          parts.district,
          parts.city,
          result.ada && result.parsel ? `Ada ${result.ada} · Parsel ${result.parsel}` : '',
        ].filter(Boolean);
        setMapLabel(labelParts.join(' · '));
        setMapCoords({ lat: result.coordinates.lat, lng: result.coordinates.lng });
        const ring = parsePolygon(result.geometry);
        setPolygon(ring);
        onParcelGeometryChange?.(ring ? result.geometry : null);
      } else {
        setError('Bu bilgiler için konum bulunamadı. İl ve ilçe bilgisini kontrol edin.');
        clearParcel();
      }
    } catch {
      setError('Konum sorgusu tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cardClass}>
      <div className={`mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] ${headerClass}`}>
        <MapPin size={14} /> {title}
      </div>

      <LocationPicker onChange={() => {}} onPartsChange={handleLocation} theme={variant} />

      <div className={`mt-3 border-t ${dividerClass} pt-3`}>
        <p className={`mb-2 text-[11px] font-semibold ${labelClass}`}>Ada / Parsel ile konumu otomatik işaretle <span className="opacity-60">(isteğe bağlı)</span></p>
        <AdaParselPicker
          city={parts.city}
          district={parts.district}
          neighborhood={parts.neighborhood}
          ada={ada}
          parsel={parsel}
          onAdaChange={handleAdaChange}
          onParselChange={handleParselChange}
          onVerified={onParcelVerified}
          theme={variant}
        />
        <button
          type="button"
          onClick={() => void searchParcel()}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b82f6] py-2 text-xs font-bold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
        >
          {busy ? <><LoaderCircle size={14} className="animate-spin" /> Sorgulanıyor...</> : <><Search size={14} /> {ada && parsel ? "Parselden konumu bul" : "Adresten konumu bul"}</>}
        </button>
        {error && <p className={`mt-2 text-[11px] ${errorClass}`}>{error}</p>}
        {found && <p className={`mt-2 text-[11px] ${successClass}`}>Konum bulundu ve haritaya işaretlendi{foundSource === 'TKGM' ? ' (TKGM resmi konum)' : ''}.</p>}
        {mapCoords && (
          <div className="mt-3 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="h-[200px] w-full">
              <TurkeyMap
                latitude={mapCoords.lat}
                longitude={mapCoords.lng}
                onPick={() => {}}
                markerType="parcel"
                polygon={polygon}
              />
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 text-[11px] font-semibold ${dark ? 'bg-white/5 text-[#c8c6d0]' : 'bg-[#eef3ed] text-[#526257]'}`}>
              <MapPin size={12} className="shrink-0 text-[#3b82f6]" />
              <span className="truncate">{mapLabel}</span>
              {foundSource === 'TKGM' && <span className="ml-auto shrink-0 rounded-full bg-[#3b82f6]/15 px-2 py-0.5 text-[9px] font-bold text-[#3b82f6]">TKGM</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
