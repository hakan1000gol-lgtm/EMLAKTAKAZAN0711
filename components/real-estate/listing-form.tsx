'use client';

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ImagePlus, Loader2, MapPin, EyeOff, Sparkles, Trash2, Video as VideoIcon, Wand2, X } from 'lucide-react';
import { analyzeListingPrice, createListing, type PropertyAnalysis } from '@/lib/real-estate/service';
import { updateOwnedListing, type OwnedListingChanges, type OwnedListingDetail } from '@/lib/real-estate/owner-listings';
import { allPropertyTypeOptions, type PropertyType } from '@/lib/real-estate/property-types';
import { selectedFeatureTags, specifiedFeatureDetails, featureFieldsFor } from '@/lib/real-estate/property-features';
import { generateListingDescription } from '@/lib/real-estate/description';
import { AddressSection } from '@/components/real-estate/address-section';
import { parsePolygon } from '@/lib/real-estate/parcel-geometry';import { ListingFeatureFields } from '@/components/real-estate/listing-feature-fields';
import { ListingSellerFields, emptySellerDetails } from '@/components/real-estate/listing-seller-fields';
import { ListingImportSection } from '@/components/real-estate/listing-import-section';

import type { ImportedListingDraft } from '@/lib/real-estate/listing-import';
import { supabase } from '@/lib/supabase/client';

const TurkeyMap = dynamic(() => import('@/components/real-estate/turkey-map').then((m) => m.TurkeyMap), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-[#849087]">Harita yükleniyor...</div>,
});

const roomOptions = ['1+0', '1+1', '2+0', '2+1', '2+2', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2', '6+1', '7+1', '8+1', 'Dubleks', 'Diğer'];
const floorOptions = ['Zemin', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21-25', '26-30', '31-40', '41-50', '+50', 'Çatı katı', 'Bahçe katı', 'Yüksek giriş', 'Ara kat', 'Giriş katı', 'Bodrum'];

const apartmentTypes = ['Daire', 'Rezidans', 'Yalı Dairesi', 'Apartman Dairesi', 'Kooperatif', 'Günlük Kiralık', 'Devre Mülk'];
const officeTypes = ['Ofis', 'Plaza', 'İş Hanı', 'Büro', 'İş Hanı Katı & Ofisi', 'Plaza Katı & Ofisi', 'Rezidans Katı & Ofisi'];
const shopTypes = ['Dükkan', 'Showroom', 'Restoran', 'AVM'];
const industrialTypes = ['Depo', 'Fabrika', 'İmalathane', 'Atölye', 'Maden Ocağı'];

function floorFieldForType(type: PropertyType, value: string, onChange: (value: string) => void) {
  const inputClass = 'rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10';
  const selectClass = inputClass;
  if (apartmentTypes.includes(type)) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">Bulunduğu kat</option>
        {floorOptions.map((floor) => <option key={floor} value={floor}>{floor}</option>)}
      </select>
    );
  }
  if (officeTypes.includes(type) || shopTypes.includes(type)) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">Bulunduğu kat</option>
        {['Zemin', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11-15', '16-20', '21+', 'Çatı katı', 'Bodrum'].map((floor) => <option key={floor} value={floor}>{floor}</option>)}
      </select>
    );
  }
  if (industrialTypes.includes(type)) {
    return (
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder="Toplam kat sayısı" />
    );
  }
  if (type === 'Arsa' || type === 'İmarsız' || type === 'Tarla' || type === 'Bağ' || type === 'Bahçe') {
    return (
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder="Ada/Parsel (varsa)" />
    );
  }
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder="Toplam kat sayısı" />
  );
}

function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits ? new Intl.NumberFormat('tr-TR').format(Number(digits)) : '';
}

function numericValue(value: string): number {
  return Number(value.replace(/\D/g, ''));
}

export function ListingForm({ onClose, editing, onSaved }: { onClose: () => void; editing?: OwnedListingDetail; onSaved?: () => void }) {
  const [type, setType] = useState<PropertyType>((editing?.property_type as PropertyType | undefined) ?? 'Daire');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(editing?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(editing?.longitude ?? null);
  const [photos, setPhotos] = useState<string[]>(editing?.image_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(editing?.video_url ?? null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [ada, setAda] = useState(editing?.ada ?? '');
  const [parsel, setParsel] = useState(editing?.parsel ?? '');
  const [locationHidden, setLocationHidden] = useState(editing?.location_hidden ?? false);
  const [parcelGeometry, setParcelGeometry] = useState<string | null>(editing?.parcel_geometry ?? null);
  const parcelPolygon = useMemo(() => parsePolygon(parcelGeometry), [parcelGeometry]);
  const [seller, setSeller] = useState(emptySellerDetails);
  const [importNote, setImportNote] = useState('');
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    city: editing?.city ?? '',
    district: editing?.district ?? '',
    neighborhood: editing?.neighborhood ?? '',
    price: editing ? formatPrice(String(editing.price)) : '',
    area: editing ? String(editing.area) : '',
    rooms: editing?.rooms ?? '',
    floor: editing?.floor ?? '',
    details: (editing?.details ?? {}) as Record<string, string>,
  });

  const update = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMissingFields((current) => current.filter((field) => field !== key));
  };
  const fieldClass = (field: string, base: string) => `${base} ${missingFields.includes(field) ? 'border-2 border-[#dc2626] ring-2 ring-[#dc2626]/15' : ''}`;
  const updateDetail = (key: string, value: string) => setForm((current) => ({ ...current, details: { ...current.details, [key]: value } }));

  function applyImportedDraft(draft: ImportedListingDraft) {
    setForm((current) => ({
      ...current,
      title: draft.title ?? current.title,
      description: draft.description ?? current.description,
      price: draft.price ? formatPrice(String(draft.price)) : current.price,
      area: draft.area ? String(draft.area) : current.area,
      rooms: draft.rooms ?? current.rooms,
      floor: draft.floor ?? current.floor,
    }));
    const matchedType = allPropertyTypeOptions.find((option) => option === draft.propertyTypeLabel);
    if (matchedType) setType(matchedType);
    const ageField = featureFieldsFor(matchedType ?? type).find((field) => field.key === 'Bina yaşı');
    if (draft.buildingAge && ageField?.options.includes(draft.buildingAge)) updateDetail('Bina yaşı', draft.buildingAge);
    const location = draft.locationHint ? ` Sahibinden konumu: ${draft.locationHint}. Lütfen il, ilçe ve mahalleyi aşağıdan seçin.` : '';
    setImportNote(`Bilgiler çekildi. Kontrol edip gerekirse düzeltin, fotoğraflarınızı ekleyin ve İlanı yayınla ile onaya gönderin.${location}`);
  }

  async function runAnalysis() {
    if (!form.city || !form.district || !form.area || !form.price) return;
    setAnalysis(await analyzeListingPrice({
      city: form.city, district: form.district, propertyType: type,
      area: Number(form.area), price: numericValue(form.price),
    }));
  }

  function suggestDescription() {
    setSuggestion(generateListingDescription({
      type, city: form.city, district: form.district, neighborhood: form.neighborhood,
      area: Number(form.area), rooms: form.rooms, floor: form.floor,
      details: specifiedFeatureDetails(type, form.details),
      features: selectedFeatureTags(type, form.details),
    }));
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    if (photos.length + files.length > 12) { setError('En fazla 12 fotoğraf ekleyebilirsiniz.'); return; }
    setUploading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Fotoğraf yüklemek için giriş yapmalısınız.'); setUploading(false); return; }
    const uploaded: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setError(`${file.name} bir görsel değil.`); continue; }
      if (file.size > 10 * 1024 * 1024) { setError(`${file.name} 10 MB'dan büyük.`); continue; }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadError) { setError('Fotoğraf yüklenemedi.'); continue; }
      uploaded.push(supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl);
    }
    setPhotos((current) => [...current, ...uploaded]);
    setUploading(false);
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  async function handleVideoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = (event.target.files ?? [])[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Lütfen bir video dosyası seçin.'); return; }
    if (file.size > 100 * 1024 * 1024) { setError('Video 100 MB\'dan büyük olamaz.'); return; }
    setUploadingVideo(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Video yüklemek için giriş yapmalısınız.'); setUploadingVideo(false); return; }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) { setError('Video yüklenemedi.'); setUploadingVideo(false); return; }
    setVideoUrl(supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl);
    setUploadingVideo(false);
  }

  function removeVideo() { setVideoUrl(null); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiredFields = [
      ['title', form.title],
      ['price', form.price],
      ['city', form.city],
      ['district', form.district],
      ['neighborhood', form.neighborhood],
      ['area', form.area],
      ['rooms', form.rooms],
      ['description', form.description],
    ];
    const missing = requiredFields.filter(([, value]) => !String(value).trim()).map(([field]) => field);
    setMissingFields(missing);
    if (missing.length > 0) {
      setError('Kırmızı çerçeveli alanları doldurun.');
      requestAnimationFrame(() => fieldRefs.current[missing[0]]?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    if (!editing) {
      if (seller.sellerType === 'agent' && (!seller.agentOfficeName.trim() || !seller.agentAuthorityNumber.trim() || !seller.agentMykNumber.trim() || !seller.authorityDocumentPath)) {
        setError('Emlakçı olarak ilan vermek için işletme unvanı, yetki belge numarası, MYK numarası ve yetki belgesi görüntüsünü eklemelisiniz.');
        return;
      }
    }
    setBusy(true);
    setError('');
    const listingFields: OwnedListingChanges = {
      title: form.title, description: form.description, propertyType: type,
      city: form.city, district: form.district, neighborhood: form.neighborhood,
      price: numericValue(form.price), area: Number(form.area), rooms: form.rooms,
      floor: form.floor, features: selectedFeatureTags(type, form.details),
      details: specifiedFeatureDetails(type, form.details), latitude, longitude,
      imageUrls: photos,
      videoUrl,
      ada: ada || null,
      parsel: parsel || null,
      locationHidden,
      parcelGeometry,
    };
    try {
      if (editing) {
        await updateOwnedListing(editing.id, listingFields);
        onSaved?.();
        onClose();
      } else {
        const { error: insertError } = await createListing({
          ...listingFields, latitude: latitude ?? undefined, longitude: longitude ?? undefined, seller,
          ada: ada || undefined, parsel: parsel || undefined, locationHidden,
        });
        if (insertError) throw insertError;
        onClose();
      }
    } catch {
      setError('İlan kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1b241e]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#f7f5ef] p-7 shadow-2xl dark:bg-[#1f2a23] sm:rounded-3xl sm:p-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[#9a7a4c]">{editing ? 'İlan düzenle' : 'İlan oluştur'}</p>
            <h2 className="display text-4xl">{editing ? 'İlanını güncelle' : 'Yeni mülkünü yayınla'}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2"><X size={18} /></button>
        </div>

        {!editing && (
          <div className="mb-5 space-y-5">
            <ListingImportSection onImport={applyImportedDraft} />
            {importNote && <p className="rounded-xl bg-[#e2eee1] px-4 py-3 text-xs leading-5 text-[#405847]">{importNote}</p>}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <input ref={(element) => { fieldRefs.current.title = element; }} value={form.title} onChange={(e) => update('title', e.target.value)}
            className={fieldClass('title', 'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10')}
            placeholder="İlan başlığı" />

          <div className="grid gap-5 sm:grid-cols-2">
            <select value={type} onChange={(e) => setType(e.target.value as PropertyType)}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10">
              {allPropertyTypeOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input ref={(element) => { fieldRefs.current.price = element; }} value={form.price} onChange={(e) => update('price', formatPrice(e.target.value))}
              inputMode="numeric"
              className={fieldClass('price', 'rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10')}
              placeholder="Fiyat (TL)" />
          </div>

          <div ref={(element) => { fieldRefs.current.city = element; }} className={missingFields.some((field) => ['city', 'district', 'neighborhood'].includes(field)) ? 'rounded-2xl border-2 border-[#dc2626] p-1 ring-2 ring-[#dc2626]/15' : ''}>
          <AddressSection
            initialCity={form.city}
            initialDistrict={form.district}
            initialNeighborhood={form.neighborhood}
            initialAda={ada}
            initialParsel={parsel}
            onLocationChange={(parts) => {
              update('city', parts.city);
              update('district', parts.district);
              update('neighborhood', parts.neighborhood);
            }}
            onAdaParselChange={(newAda, newParsel) => { setAda(newAda); setParsel(newParsel); }}
            onCoordinatesFound={(lat, lng, _source) => {
              setLatitude(lat);
              setLongitude(lng);
              setShowMap(true);
            }}
            onParcelGeometryChange={setParcelGeometry}
            title="İlan adresi ve konum"
            variant="dark"
          />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <input ref={(element) => { fieldRefs.current.area = element; }} value={form.area} onChange={(e) => update('area', e.target.value)}
              type="number" min="1"
              className={fieldClass('area', 'rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10')}
              placeholder="m² (net kullanım alanı)" />
            <select ref={(element) => { fieldRefs.current.rooms = element; }} value={form.rooms} onChange={(e) => update('rooms', e.target.value)}
              className={fieldClass('rooms', 'rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10')}>
              <option value="">Oda sayısı</option>
              {roomOptions.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
            {floorFieldForType(type, form.floor, (value) => update('floor', value))}
          </div>

          <ListingFeatureFields type={type} values={form.details} onChange={updateDetail} />

          {!editing && <ListingSellerFields value={seller} onChange={setSeller} />}

          <div className="space-y-3">
            <textarea ref={(element) => { fieldRefs.current.description = element; }} value={form.description} onChange={(e) => update('description', e.target.value)}
              className={fieldClass('description', 'min-h-28 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10')}
              placeholder="İlan açıklaması" />
            <button type="button" onClick={suggestDescription}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b9cbb9] bg-[#eef4ed] py-3 text-sm font-semibold text-[#405847]">
              <Wand2 size={16} /> Girdiğin bilgilere göre açıklama öner
            </button>
            {suggestion && (
              <div className="rounded-2xl border border-[#b9cbb9] bg-white p-4 dark:bg-white/5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#617663]">Önerilen açıklama</p>
                <p className="text-sm leading-6 text-[#2d3a31] dark:text-[#d7e3d8]">{suggestion}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => { update('description', suggestion); setSuggestion(''); }}
                    className="rounded-xl bg-[#405847] px-4 py-2 text-xs font-semibold text-white">Açıklamaya ekle</button>
                  <button type="button" onClick={() => setSuggestion('')}
                    className="rounded-xl border border-black/10 px-4 py-2 text-xs font-semibold text-[#405847]">Vazgeç</button>
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={runAnalysis}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b9cbb9] bg-[#eef4ed] py-3 text-sm font-semibold text-[#405847]">
            <Sparkles size={16} /> EMLAKTAKAZAN AI ile fiyatı analiz et
          </button>

          {analysis && (
            <div className="rounded-2xl bg-[#e2eee1] p-4 text-sm text-[#405847]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] opacity-70">EMLAKTAKAZAN AI ön analizi</p>
                  <strong className="mt-1 block text-lg">{analysis.score} · {new Intl.NumberFormat('tr-TR').format(analysis.low)} – {new Intl.NumberFormat('tr-TR').format(analysis.high)} TL</strong>
                </div>
                <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold">%{analysis.confidence} güven</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <span className="rounded-xl bg-white/60 p-2"><b className="block text-sm">{new Intl.NumberFormat('tr-TR').format(analysis.pricePerSquareMeter)} TL</b>m² fiyatı</span>
                <span className="rounded-xl bg-white/60 p-2"><b className="block text-sm">{new Intl.NumberFormat('tr-TR').format(analysis.estimatedMonthlyRent)} TL</b>tahmini kira</span>
                <span className="rounded-xl bg-white/60 p-2"><b className="block text-sm">%{analysis.annualYield}</b>brüt getiri</span>
              </div>
              <p className="mt-3 text-xs leading-5 opacity-80">{analysis.note}</p>
              <ul className="mt-2 space-y-1 text-xs">{analysis.suggestions.map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}</ul>
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-[#aebbad] bg-[#eef3ed] p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#405847] dark:text-[#d7e3d8]">İlan fotoğrafları</p>
              <span className="text-xs text-[#849087]">{photos.length}/12</span>
            </div>
            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((url, index) => (
                  <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                    <img src={url} alt={`Fotoğraf ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label="Kaldır">
                      <Trash2 size={13} />
                    </button>
                    {index === 0 && <span className="absolute bottom-1 left-1 rounded-md bg-[#f43f68] px-1.5 py-0.5 text-[10px] font-bold text-white">Kapak</span>}
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#aebbad] py-6 transition hover:border-[#405847] hover:bg-[#e8eee7] dark:hover:bg-white/10">
              {uploading ? <Loader2 size={24} className="animate-spin text-[#66806b]" /> : <ImagePlus size={24} className="text-[#66806b]" />}
              <span className="mt-2 text-sm font-semibold text-[#405847] dark:text-[#d7e3d8]">{uploading ? 'Yükleniyor...' : 'Fotoğraf seç'}</span>
              <span className="mt-1 text-xs text-[#849087]">En fazla 12 fotoğraf, her biri 10 MB'a kadar</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => void handlePhotoUpload(e)} disabled={uploading || photos.length >= 12} />
            </label>
          </div>

          <div className="rounded-2xl border border-dashed border-[#aebbad] bg-[#eef3ed] p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#405847] dark:text-[#d7e3d8]"><VideoIcon size={16} /> İlan videosu</p>
              {videoUrl && <span className="text-xs text-[#849087]">Video eklendi</span>}
            </div>
            {videoUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                <video src={videoUrl} controls className="aspect-video w-full object-cover" />
                <button type="button" onClick={removeVideo} className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80" aria-label="Videoyu kaldır">
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#aebbad] py-6 transition hover:border-[#405847] hover:bg-[#e8eee7] dark:hover:bg-white/10">
                {uploadingVideo ? <Loader2 size={24} className="animate-spin text-[#66806b]" /> : <VideoIcon size={24} className="text-[#66806b]" />}
                <span className="mt-2 text-sm font-semibold text-[#405847] dark:text-[#d7e3d8]">{uploadingVideo ? 'Yükleniyor...' : 'Video seç'}</span>
                <span className="mt-1 text-xs text-[#849087]">En fazla 1 video, 100 MB'a kadar (MP4, WebM)</span>
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => void handleVideoUpload(e)} disabled={uploadingVideo} />
              </label>
            )}
          </div>

          <button type="button" onClick={() => setShowMap(!showMap)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${showMap ? 'border-[#405847] bg-[#405847] text-white' : 'border-black/10 bg-white text-[#405847] dark:border-white/10 dark:bg-white/10'}`}>
            <MapPin size={17} /> {latitude !== null ? `Konum seçildi: ${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Haritada konum işaretle'}
          </button>

          {showMap && (
            <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
              <div className="h-[320px] w-full">
                <TurkeyMap latitude={latitude} longitude={longitude} onPick={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} polygon={parcelPolygon} />
              </div>
              <p className="bg-[#f0f5ef] px-4 py-2 text-xs text-[#526257] dark:bg-white/5 dark:text-[#aaa9b6]">
                Haritada bir noktaya tıklayarak ilan konumunu işaretleyin. Türkiye sınırları içinde seçim yapabilirsiniz.
              </p>
            </div>
          )}

          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition ${locationHidden ? 'border-[#3b82f6] bg-[#3b82f6]/5 text-[#3b82f6]' : 'border-black/10 bg-white text-[#526257] dark:border-white/10 dark:bg-white/10 dark:text-[#d7e3d8]'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${locationHidden ? 'border-[#3b82f6] bg-[#3b82f6] text-white' : 'border-black/20 dark:border-white/30'}`}>
              {locationHidden && <EyeOff size={12} />}
            </span>
            <input type="checkbox" checked={locationHidden} onChange={(e) => setLocationHidden(e.target.checked)} className="hidden" />
            <span>Konumu gizle (yaklaşık alan göster)</span>
            <span className="ml-auto text-[10px] font-normal opacity-70">İşaretlerseniz ziyaretçiler tam konumu değil, merkezi seçilen noktada 1 km² bir alan görür</span>
          </label>

          {error && <p className="rounded-xl bg-[#f4e4dd] px-4 py-3 text-xs text-[#8c5545]">{error}</p>}

          <button disabled={busy}
            className="w-full rounded-xl bg-[#405847] py-4 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Kaydediliyor...' : editing ? 'Değişiklikleri kaydet' : 'İlanı yayınla'}
          </button>
        </form>
      </div>
    </div>
  );
}
