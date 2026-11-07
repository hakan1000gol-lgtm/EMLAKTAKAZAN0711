export {};

declare const Deno: { serve: (handler: (request: Request) => Response | Promise<Response>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TKGM_CBS_BASE = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api";
const TKGM_IL_LISTE_URL = "https://parselsorgu.tkgm.gov.tr/app/modules/administrativeQuery/data/ilListe.json";

interface TkgmCoordinate { lat: number; lng: number; }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractCenter(geometry: unknown): TkgmCoordinate | null {
  if (!geometry || typeof geometry !== "object") return null;
  const geom = geometry as Record<string, unknown>;
  const type = geom.type as string | undefined;
  const coords = geom.coordinates;
  if (!coords) return null;

  if (type === "Point" && Array.isArray(coords) && coords.length >= 2) {
    return { lng: Number(coords[0]), lat: Number(coords[1]) };
  }

  let rings: number[][][] = [];
  if (type === "Polygon" && Array.isArray(coords)) {
    rings = coords as number[][][];
  } else if (type === "MultiPolygon" && Array.isArray(coords)) {
    const polys = coords as number[][][][];
    rings = polys[0] ?? [];
  } else {
    return null;
  }

  const ring = rings[0];
  if (!Array.isArray(ring) || ring.length === 0) return null;
  let latSum = 0, lngSum = 0;
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    lngSum += Number(pt[0]);
    latSum += Number(pt[1]);
  }
  return { lat: latSum / ring.length, lng: lngSum / ring.length };
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: { "Accept": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function parseGeoJsonFeatures(data: unknown): { id: number; text: string }[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const features = obj.features;
  if (!Array.isArray(features)) return [];
  return features
    .map((f) => {
      const props = (f as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      if (!props) return null;
      const id = Number(props.id);
      const text = String(props.text ?? props.ad ?? "");
      if (!id || !text) return null;
      return { id, text };
    })
    .filter((x): x is { id: number; text: string } => x !== null);
}

async function findIlId(cityName: string): Promise<number | null> {
  const data = await fetchJson(TKGM_IL_LISTE_URL);
  const list = parseGeoJsonFeatures(data);
  const target = cityName.trim().toLowerCase();
  const match = list.find((il) => il.text.trim().toLowerCase() === target);
  return match?.id ?? null;
}

async function findIlceId(ilId: number, districtName: string): Promise<number | null> {
  const data = await fetchJson(`${TKGM_CBS_BASE}/idariYapi/ilceListe/${ilId}`);
  const list = parseGeoJsonFeatures(data);
  const target = districtName.trim().toLowerCase();
  const match = list.find((ilce) => ilce.text.trim().toLowerCase() === target);
  return match?.id ?? null;
}

async function findMahalleId(ilceId: number, neighborhoodName: string): Promise<{ id: number; ad: string } | null> {
  const data = await fetchJson(`${TKGM_CBS_BASE}/idariYapi/mahalleListe/${ilceId}`);
  const list = parseGeoJsonFeatures(data);
  const target = neighborhoodName.trim().toLowerCase();
  const match = list.find((m) => m.text.trim().toLowerCase() === target);
  return match ? { id: match.id, ad: match.text } : null;
}

async function resolveMahalleId(city: string, district: string, neighborhood: string): Promise<number | null> {
  const ilId = await findIlId(city);
  if (!ilId) return null;
  const ilceId = await findIlceId(ilId, district);
  if (!ilceId) return null;
  const mahalle = await findMahalleId(ilceId, neighborhood);
  return mahalle?.id ?? null;
}

interface ParcelProperties {
  adaNo?: string;
  parselNo?: string;
  mahalleAd?: string;
  ilAd?: string;
  ilceAd?: string;
  nitelik?: string;
  alan?: string;
}

async function queryParcel(mahalleId: number, ada: string, parsel: string): Promise<{ coordinates: TkgmCoordinate | null; geometry: unknown; properties: ParcelProperties | null } | null> {
  const url = `${TKGM_CBS_BASE}/parsel/${mahalleId}/${ada}/${parsel}`;
  const data = await fetchJson(url) as Record<string, unknown>;
  if (data?.Message) return null;
  const geometry = data?.geometry ?? data?.geom ?? null;
  const properties = (data?.properties ?? null) as ParcelProperties | null;
  const center = extractCenter(geometry);
  if (center) return { coordinates: center, geometry, properties };
  if (data && typeof data === "object" && "lat" in data && "lng" in data) {
    return { coordinates: { lat: Number((data as Record<string, unknown>).lat), lng: Number((data as Record<string, unknown>).lng) }, geometry: null, properties: null };
  }
  return null;
}

async function queryParcelByCoordinate(lat: number, lng: number): Promise<{ coordinates: TkgmCoordinate; geometry: unknown; properties: ParcelProperties | null } | null> {
  const url = `${TKGM_CBS_BASE}/parsel/${lat}/${lng}/`;
  const data = await fetchJson(url) as Record<string, unknown>;
  if (data?.Message) return null;
  const geometry = data?.geometry ?? data?.geom ?? null;
  const properties = (data?.properties ?? null) as ParcelProperties | null;
  const center = extractCenter(geometry);
  return { coordinates: center ?? { lat, lng }, geometry, properties };
}

async function nominatimSearch(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=tr`,
    { headers: { "User-Agent": "EMLAKTAKAZAN/1.0", "Accept-Language": "tr" } },
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name ?? "" };
  }
  return null;
}

async function handleParcelLookup(city: string, district: string, neighborhood: string, ada: string | undefined, parsel: string | undefined): Promise<Response> {
  const neighborhoodStr = neighborhood ?? "";
  let coordinates: { lat: number; lng: number } | null = null;
  let displayName = "";
  let source = "";
  let geometry: unknown = null;
  let parcelInfo: ParcelProperties | null = null;

  if (ada && parsel) {
    try {
      const mahalleId = await resolveMahalleId(city, district, neighborhoodStr);
      if (mahalleId) {
        const parcel = await queryParcel(mahalleId, String(ada), String(parsel));
        if (parcel) {
          coordinates = parcel.coordinates;
          geometry = parcel.geometry;
          parcelInfo = parcel.properties;
          source = "TKGM";
          displayName = `${neighborhoodStr || parcelInfo?.mahalleAd || ""}, ${district}, ${city}`;
        }
      }
    } catch {
      // TKGM may be down or parcel not found — fall through to Nominatim
    }

    if (!coordinates) {
      const fallbackQuery = `${city} ${district} ${neighborhoodStr} ada ${ada} parsel ${parsel}`.trim();
      const result = await nominatimSearch(fallbackQuery);
      if (result) { coordinates = { lat: result.lat, lng: result.lng }; displayName = result.displayName; source = "OpenStreetMap"; }
    }
  }

  if (!coordinates) {
    if (neighborhoodStr) {
      const result = await nominatimSearch(`${city} ${district} ${neighborhoodStr}`.trim());
      if (result) { coordinates = { lat: result.lat, lng: result.lng }; displayName = result.displayName; source = "OpenStreetMap"; }
    }
    if (!coordinates) {
      const result = await nominatimSearch(`${city} ${district}`.trim());
      if (result) { coordinates = { lat: result.lat, lng: result.lng }; displayName = result.displayName; source = "OpenStreetMap"; }
    }
    if (!coordinates) {
      const result = await nominatimSearch(city.trim());
      if (result) { coordinates = { lat: result.lat, lng: result.lng }; displayName = result.displayName; source = "OpenStreetMap"; }
    }
  }

  const result = {
    city, district,
    neighborhood: neighborhoodStr || parcelInfo?.mahalleAd || null,
    ada: ada ? String(ada) : (parcelInfo?.adaNo ?? null),
    parsel: parsel ? String(parsel) : (parcelInfo?.parselNo ?? null),
    coordinates,
    geometry: geometry ? JSON.stringify(geometry) : null,
    displayName, source,
    parcelInfo,
    query: `${city} ${district} ${neighborhoodStr} ${ada ?? ""} ${parsel ?? ""}`.trim(),
    note: !coordinates
      ? "Belirtilen bilgiler için konum bulunamadı. İl ve ilçe bilgisini kontrol edip tekrar deneyin."
      : source === "TKGM"
        ? "Konum TKGM (Tapu ve Kadastro Genel Müdürlüğü) resmi CBS servisinden alınmıştır."
        : "Konum OpenStreetMap verileri kullanılarak tahmini olarak bulunmuştur. TKGM resmi parselleme verisi için parselsorgu.tkgm.gov.tr adresinden doğrulama yapılması önerilir.",
  };

  return json(result);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const mode = body.mode ?? "lookup";

    if (mode === "ilListe") {
      const data = await fetchJson(TKGM_IL_LISTE_URL);
      const list = parseGeoJsonFeatures(data).sort((a, b) => a.text.localeCompare(b.text, "tr"));
      return json({ locations: list.map((item) => ({ id: item.id, name: item.text })) });
    }

    if (mode === "ilceListe") {
      const ilId = Number(body.ilId);
      if (!ilId) return json({ error: "ilId gerekli." }, 400);
      const data = await fetchJson(`${TKGM_CBS_BASE}/idariYapi/ilceListe/${ilId}`);
      const list = parseGeoJsonFeatures(data).sort((a, b) => a.text.localeCompare(b.text, "tr"));
      return json({ locations: list.map((item) => ({ id: item.id, name: item.text })) });
    }

    if (mode === "mahalleListe") {
      const ilceId = Number(body.ilceId);
      if (!ilceId) return json({ error: "ilceId gerekli." }, 400);
      const data = await fetchJson(`${TKGM_CBS_BASE}/idariYapi/mahalleListe/${ilceId}`);
      const list = parseGeoJsonFeatures(data).sort((a, b) => a.text.localeCompare(b.text, "tr"));
      return json({ locations: list.map((item) => ({ id: item.id, name: item.text })) });
    }

    const city = body.city;
    const district = body.district;
    const neighborhood = body.neighborhood;
    const ada = body.ada;
    const parsel = body.parsel;

    if (!city || !district) {
      return json({ error: "İl ve ilçe alanları zorunludur." }, 400);
    }

    return await handleParcelLookup(city, district, neighborhood, ada, parsel);
  } catch (err) {
    return json({ error: "Sorgu sırasında bir hata oluştu: " + (err instanceof Error ? err.message : "bilinmeyen hata") }, 500);
  }
});
