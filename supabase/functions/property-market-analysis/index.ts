// EMLAKTAKAZAN property market analysis v2
export {};

declare const Deno: { serve: (handler: (request: Request) => Response | Promise<Response>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ListingMode = "satilik" | "kiralik";
type AnalysisInput = {
  city: string; district: string; neighborhood: string; propertyType: string; area: number;
  listingMode: ListingMode; features: string[]; details: Record<string, string>;
  ada?: string; parsel?: string;
};
type SearchSignal = { title: string; snippet: string; url: string };
type ReportSection = { title: string; body: string };
type Adjustment = { label: string; factor: number };

const trNumber = (value: number) => Math.round(value).toLocaleString("tr-TR");

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 80);
}

function cleanDetails(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
    if (typeof item === "string" && item.trim()) result[key.slice(0, 60)] = item.trim().slice(0, 200);
  }
  return result;
}

function parseSignals(html: string): SearchSignal[] {
  const results: SearchSignal[] = [];
  const blocks = html.match(/<a[^>]+class="result__a"[\s\S]*?<\/a>[\s\S]*?(?=<a[^>]+class="result__a"|$)/g) ?? [];
  for (const block of blocks.slice(0, 8)) {
    const title = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/)?.[1]?.replace(/<[^>]+>/g, "").trim();
    const snippet = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a|class="result__snippet"[^>]*>([\s\S]*?)<\//)?.[1]?.replace(/<[^>]+>/g, "").trim();
    const url = block.match(/class="result__url"[^>]*>([\s\S]*?)<\//)?.[1]?.replace(/<[^>]+>/g, "").trim();
    if (title && snippet) results.push({ title, snippet, url: url ?? "" });
  }
  return results;
}

type Comparable = { source: string; m2: number | null; unitPrice: number; url: string };

const COMPARABLE_SITES = ["sahibinden.com", "endeksa.com", "reidin.com", "tapusor.com"];
const SOURCE_LABELS: Record<string, string> = { "sahibinden.com": "Sahibinden", "endeksa.com": "Endeksa", "reidin.com": "REIDIN", "tapusor.com": "Tapusor" };
const UNIT_PRICE_PATTERN = /(\d{1,3}(?:[.,]\d{3})+|\d{3,6})\s*(?:TL|₺)\s*\/\s*m(?:²|2)/i;
const TOTAL_PATTERN = /(\d{1,3}(?:[.,]\d{3})+)\s*(?:TL|₺)(?!\s*\/)/i;
const AREA_PATTERN = /(\d{2,5})\s*m(?:²|2)/i;

const toNumber = (raw: string) => Number(raw.replace(/[.,]/g, ""));

function sourceOf(hit: SearchSignal): string | null {
  const haystack = `${hit.url} ${hit.title}`.toLocaleLowerCase("tr-TR");
  return COMPARABLE_SITES.find((site) => haystack.includes(site.split(".")[0])) ?? null;
}

function extractComparables(hits: SearchSignal[]): Comparable[] {
  const seen = new Set<string>();
  const comparables: Comparable[] = [];
  for (const hit of hits) {
    const source = sourceOf(hit);
    if (!source) continue;
    const text = `${hit.title} ${hit.snippet}`;
    const areaMatch = text.match(AREA_PATTERN);
    const area = areaMatch ? toNumber(areaMatch[1]) : null;
    const unitMatch = text.match(UNIT_PRICE_PATTERN);
    const totalMatch = text.match(TOTAL_PATTERN);
    let unitPrice: number | null = null;
    if (unitMatch) unitPrice = toNumber(unitMatch[1]);
    else if (totalMatch && area) {
      const total = toNumber(totalMatch[1]);
      if (total >= 200000) unitPrice = Math.round(total / area);
    }
    if (unitPrice === null || unitPrice < 1000 || unitPrice > 500000) continue;
    const key = `${source}-${unitPrice}-${area ?? 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    comparables.push({ source: SOURCE_LABELS[source], m2: area, unitPrice, url: hit.url });
  }
  return comparables.slice(0, 16);
}

function weightedUnitPrice(comparables: Comparable[]): number | null {
  if (comparables.length === 0) return null;
  if (comparables.every((item) => item.m2 !== null)) {
    const totalArea = comparables.reduce((total, item) => total + (item.m2 ?? 0), 0);
    const weighted = comparables.reduce((total, item) => total + item.unitPrice * (item.m2 ?? 0), 0);
    return Math.round(weighted / totalArea);
  }
  return Math.round(comparables.reduce((total, item) => total + item.unitPrice, 0) / comparables.length);
}

const buildingAgeFactor: Record<string, number> = {
  "0 (Yeni)": 1.08, "1": 1.05, "2": 1.04, "3": 1.03, "4": 1.02, "5": 1.01,
  "6-10 arası": 1, "11-15 arası": 0.96, "16-20 arası": 0.92, "21 ve üzeri": 0.85,
};

function featureAdjustments(input: AnalysisInput): Adjustment[] {
  const adjustments: Adjustment[] = [];
  const age = input.details["Bina yaşı"];
  if (age && buildingAgeFactor[age] !== undefined) adjustments.push({ label: `Bina yaşı: ${age}`, factor: buildingAgeFactor[age] });
  const has = (name: string) => input.features.some((feature) => feature.toLocaleLowerCase("tr-TR").includes(name));
  if (has("deniz") || has("denize sıfır")) adjustments.push({ label: "Deniz manzarası / denize yakınlık", factor: 1.08 });
  if (has("havuz")) adjustments.push({ label: "Yüzme havuzu", factor: 1.04 });
  if (has("metro") || has("metrobüs") || has("tramvay")) adjustments.push({ label: "Raylı toplu taşıma erişimi", factor: 1.03 });
  if (input.details["Otopark"] && input.details["Otopark"] !== "Yok") adjustments.push({ label: "Otopark", factor: 1.03 });
  if (input.details["Eşyalı"] === "Evet") adjustments.push({ label: "Eşyalı", factor: 1.02 });
  if (input.details["Isıtma"] === "Yok") adjustments.push({ label: "Isıtma sistemi yok", factor: 0.97 });
  if (input.details["Tapu durumu"] === "Hisseli tapu" || input.details["Tapu durumu"] === "Tarla tapulu") adjustments.push({ label: "Hisseli / tarla tapu riski", factor: 0.94 });
  if (input.details["Takas"] === "Evet") adjustments.push({ label: "Takasa açık", factor: 0.98 });
  if (input.details["Aidat"] && input.details["Aidat"] !== "Yok") adjustments.push({ label: "Aidatlı site", factor: 1.01 });
  if (input.details["Krediye uygun"] === "Evet") adjustments.push({ label: "Krediye uygun", factor: 1.02 });
  if (input.details["Site içerisinde"] === "Evet") adjustments.push({ label: "Site içerisinde (güvenlik)", factor: 1.03 });
  if (input.details["Asansör"] && input.details["Asansör"] !== "Yok") adjustments.push({ label: "Asansör", factor: 1.02 });
  if (has("ısı yalıtımı")) adjustments.push({ label: "Isı yalıtımı", factor: 1.02 });
  if (has("güvenlik")) adjustments.push({ label: "Güvenlik", factor: 1.02 });
  if (input.details["Bahçe"] === "Özel" || input.details["Bahçe"] === "Geniş") adjustments.push({ label: "Özel/geniş bahçe", factor: 1.05 });
  if (has("elektrik") && ["Arsa", "İmarsız", "Tarla", "Bağ", "Bahçe"].includes(input.propertyType)) adjustments.push({ label: "Altyapı mevcut (elektrik)", factor: 1.04 });
  if (input.details["İmar durumu"] === "Konut imarlı" || input.details["İmar durumu"] === "Ticari imarlı" || input.details["İmar durumu"] === "Konut+ticari imarlı") adjustments.push({ label: "İmarlı arsa", factor: 1.06 });
  if (input.details["Yola cephe"] === "Evet") adjustments.push({ label: "Yola cephe", factor: 1.03 });
  if (input.details["Turizm belgesi"] === "Var") adjustments.push({ label: "Turizm belgesi mevcut", factor: 1.05 });
  return adjustments;
}

const ECONOMIC_MULTIPLIER = 0.95;
const AMORTIZATION_MONTHS = [120, 180, 240, 300];
const RENT_PAYBACK_MONTHS = 300;

type ValuationMethod = { label: string; value: number; note: string };
type AmortizationRow = { months: number; value: number };

function estimate(input: AnalysisInput, signals: SearchSignal[], comparables: Comparable[]) {
  const isRent = input.listingMode === "kiralik";
  const location = `${input.city} ${input.district} ${input.neighborhood}`.toLocaleLowerCase("tr-TR");
  const premium = /istanbul|bodrum|çeşme|alaçatı|kaş|konyaaltı|beşiktaş/.test(location) ? 1.22 : /sapanca|abant|foça|urla|ayvalık/.test(location) ? 1.08 : 1;
  const typeFactor = ["Arsa", "İmarsız", "Tarla", "Bağ", "Bahçe"].includes(input.propertyType) ? 0.58 : ["Bungalow", "Tiny House", "Butik Otel", "Günlük Kiralık"].includes(input.propertyType) ? 1.3 : 1;
  const adjustments = featureAdjustments(input);
  const featureFactor = adjustments.reduce((total, item) => total * item.factor, 1);
  const webText = signals.map((item) => `${item.title} ${item.snippet}`).join(" ");
  const minimumAmount = isRent ? 3000 : 10000;
  const amounts = Array.from(webText.matchAll(/([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)\s*(?:TL|₺)/gi))
    .map((match) => Number(match[1].replace(/[.,]/g, "")))
    .filter((value) => value > minimumAmount && value < 500000000);
  const webAverage = amounts.length ? amounts.reduce((total, value) => total + value, 0) / amounts.length : 0;
  const isIzmir = input.city.toLocaleLowerCase("tr-TR") === "izmir";
  const area = Math.max(input.area, 1);
  const salePerSquareMeter = (isIzmir ? 94000 : 78000) * premium * typeFactor * featureFactor;
  const rentPerSquareMeter = (isIzmir ? 420 : 360) * premium * typeFactor * featureFactor;
  const basePerSquareMeter = isRent ? rentPerSquareMeter : salePerSquareMeter;
  const comparableUnitPrice = weightedUnitPrice(comparables);
  const modeLabel = isRent ? "kiralık" : "satılık";
  const confidence = Math.min(88, 54 + signals.length * 5 + (amounts.length ? 10 : 0));

  let low: number;
  let high: number;
  let pricePerSquareMeter: number;
  let unit = isRent ? "TL/ay" : "TL";
  let methods: ValuationMethod[] | null = null;
  let amortization: AmortizationRow[] | null = null;
  let monthlyRent: number | null = null;
  let maxSaleValue: number | null = null;

  if (isRent) {
    const reference = webAverage > 0 ? basePerSquareMeter * 0.65 + (webAverage / area) * 0.35 : basePerSquareMeter;
    low = Math.round(reference * input.area * 0.88);
    high = Math.round(reference * input.area * 1.12);
    pricePerSquareMeter = Math.round(reference);
  } else {
    const market = salePerSquareMeter * area;
    const comparable = comparableUnitPrice !== null ? comparableUnitPrice * area : market;
    monthlyRent = Math.round(rentPerSquareMeter * area);
    const income = monthlyRent * RENT_PAYBACK_MONTHS;
    methods = [
      { label: "Piyasa rayiç bedeli", value: Math.round(market), note: `${trNumber(salePerSquareMeter)} TL/m² bölge rayiciyle ${trNumber(area)} m² üzerinden hesaplandı.` },
      { label: "Emsal karşılaştırma", value: Math.round(comparable), note: comparableUnitPrice !== null ? `${comparables.length} emsal ilanın m² ağırlıklı birim fiyatı ${trNumber(comparableUnitPrice)} TL/m² x ${trNumber(area)} m².` : "Emsal ilan bulunamadı; rayiç değer kullanıldı." },
      { label: "Kira geri dönüş yöntemi", value: Math.round(income), note: `Aylık ${trNumber(monthlyRent)} TL kira x ${RENT_PAYBACK_MONTHS} ay.` },
    ];
    const values = methods.map((method) => method.value);
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    maxSaleValue = Math.round(average * ECONOMIC_MULTIPLIER);
    low = Math.round(Math.min(...values) * ECONOMIC_MULTIPLIER);
    high = Math.round(Math.max(...values) * ECONOMIC_MULTIPLIER);
    pricePerSquareMeter = Math.round(maxSaleValue / area);
    amortization = AMORTIZATION_MONTHS.map((months) => ({ months, value: Math.round(monthlyRent! * months) }));
    unit = "TL";
  }

  const rangeText = isRent ? `${trNumber(low)} - ${trNumber(high)} ${unit}` : `${trNumber(maxSaleValue!)} TL maksimum satış değeri`;
  const summary = `${input.city} ${input.district} bölgesindeki ${input.area} m² ${input.propertyType} için ${modeLabel} tahmini değer ${rangeText}. Bu değer ${signals.length} web kaynağı ve ${adjustments.length} özellik düzeltmesiyle hesaplandı.`;

  const sampleListings = signals.length
    ? signals.slice(0, 6).map((item) => `- ${item.title}${item.url ? ` (${item.url})` : ""}`).join("\n")
    : "Arama sonucu alınamadı; örnek ilan bulunamadı.";

  const risks = [
    input.details["Bina yaşı"] ? null : "Bina yaşı belirtilmemiş; bina yaşı girildiğinde değerleme daha isabetli olur.",
    adjustments.some((item) => item.label.includes("tapu riski")) ? "Tapu durumu hisseli veya tarla olarak girilmiş; bu durum satış ve kredi sürecini uzatabilir." : null,
    input.details["Takas"] === "Evet" ? "Takasa açık ilanlar genellikle daha uzun süre piyasada kalır; fiyat müzakereye açıktır." : null,
    input.details["Krediye uygun"] === "Hayır" ? "Krediye uygun değil olarak işaretlenmiş; bu durum alıcı havuzunu daraltabilir." : null,
    signals.length === 0 ? "Canlı web verisi bulunamadığı için sonuç ön tahmin niteliğindedir." : null,
  ].filter((item): item is string => Boolean(item));

  const valuationSection: ReportSection[] = methods && amortization && monthlyRent !== null && maxSaleValue !== null
    ? [
      { title: "Emsal ilanlar", body: comparables.length
        ? [
          ...comparables.map((item) => `- ${item.source}: ${item.m2 ? `${item.m2} m² · ` : ""}${trNumber(item.unitPrice)} TL/m²`),
          `Ağırlıklı ortalama: ${trNumber(comparableUnitPrice ?? 0)} TL/m²`,
        ].join("\n")
        : "Sahibinden, Endeksa, REIDIN ve Tapusor sonuçlarında emsal ilan bulunamadı." },
      { title: "Üç yöntemli değerleme", body: [
        ...methods.map((method) => `- ${method.label}: ${trNumber(method.value)} TL (${method.note})`),
        `Üç yöntemin ortalaması ${trNumber(methods.reduce((total, method) => total + method.value, 0) / methods.length)} TL alındı.`,
        `Güncel ekonomik durum çarpanı %${Math.round(ECONOMIC_MULTIPLIER * 100)} uygulanarak kısa ve orta vadeli maksimum satış değeri ${trNumber(maxSaleValue)} TL bulundu.`,
      ].join("\n") },
      { title: "Kira amortisman süreleri", body: [
        `Tahmini aylık kira: ${trNumber(monthlyRent)} TL`,
        ...amortization.map((row) => `- ${row.months} ay (${row.months / 12} yıl): ${trNumber(row.value)} TL`),
      ].join("\n") },
    ]
    : [];

  const typeDetailNotes: string[] = [];
  if (input.details["İmar durumu"]) typeDetailNotes.push(`İmar durumu: ${input.details["İmar durumu"]}`);
  if (input.details["KAKS"]) typeDetailNotes.push(`KAKS (emsal): ${input.details["KAKS"]}`);
  if (input.details["Gabari"]) typeDetailNotes.push(`Gabari: ${input.details["Gabari"]}`);
  if (input.details["Bahçe"]) typeDetailNotes.push(`Bahçe: ${input.details["Bahçe"]}`);
  if (input.details["Aidat"]) typeDetailNotes.push(`Aidat: ${input.details["Aidat"]} TL/ay`);
  if (input.details["Oda sayısı"]) typeDetailNotes.push(`Oda sayısı: ${input.details["Oda sayısı"]}`);
  if (input.details["Banyo sayısı"]) typeDetailNotes.push(`Banyo sayısı: ${input.details["Banyo sayısı"]}`);
  if (input.details["Isıtma"]) typeDetailNotes.push(`Isıtma: ${input.details["Isıtma"]}`);
  if (input.details["Turizm belgesi"]) typeDetailNotes.push(`Turizm belgesi: ${input.details["Turizm belgesi"]}`);

  const report: ReportSection[] = [
    { title: "Özet", body: summary },
    { title: "Piyasa bağlamı", body: `${input.city} ${input.district} için ${modeLabel} ${input.propertyType.toLocaleLowerCase("tr-TR")} piyasası web kaynaklarında tarandı (${signals.length} kaynak). ${premium > 1 ? "Bölge, yüksek talepli bir konum olduğu için prim katsayısı uygulandı." : "Bölge standart konum katsayısıyla değerlendirildi."}` },
    ...valuationSection,
    { title: "Emlak tipi özellikleri", body: typeDetailNotes.length ? typeDetailNotes.map((item) => `- ${item}`).join("\n") : "Emlak tipine özel bilgi girilmemiş; genel bölge ortalaması kullanıldı." },
    { title: "Hesaplama", body: `Bölgesel ${isRent ? "aylık m² kira" : "m² değer"} taban fiyatı ${trNumber(basePerSquareMeter / featureFactor)} TL, konum katsayısı ${premium}, emlak tipi katsayısı ${typeFactor}, özellik katsayısı ${featureFactor.toFixed(2)}. Web sinyallerinden çıkan ortalama tutar ${webAverage ? `${trNumber(webAverage)} TL` : "bulunamadı"}.` },
    { title: "Özellik etkileri", body: adjustments.length ? adjustments.map((item) => `- ${item.label}: %${Math.round((item.factor - 1) * 100)}`).join("\n") : "Belirtilen özellik yok; bölge ortalaması kullanıldı." },
    { title: "Örnek ilanlar ve kaynaklar", body: sampleListings },
    { title: "Riskler ve dikkat edilecekler", body: risks.length ? risks.map((item) => `- ${item}`).join("\n") : "Belirgin bir risk tespit edilmedi." },
    { title: "Sonuç", body: `Bu rapor ${modeLabel} değerlendirme için ön bilgi amaçlıdır. Kesin fiyat kararı öncesi güncel ilanlar ve yerinde inceleme ile doğrulayın.` },
  ];

  return {
    listingMode: input.listingMode, summary, low, high, unit,
    pricePerSquareMeter, sourceCount: signals.length, confidence, signals: signals.slice(0, 6), report,
    methods, amortization, monthlyRent, maxSaleValue,
    comparables: comparables.slice(0, 8), comparableUnitPrice,
  };
}

async function search(query: string): Promise<SearchSignal[]> {
  const searchResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "EMLAKTAKAZAN-market-analysis/1.0" } });
  return searchResponse.ok ? parseSignals(await searchResponse.text()) : [];
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const body = await request.json() as Record<string, unknown>;
    const listingMode = body.listingMode === "kiralik" ? "kiralik" : body.listingMode === "satilik" ? "satilik" : null;
    const input: AnalysisInput = {
      city: clean(body.city, 60), district: clean(body.district, 60), neighborhood: clean(body.neighborhood, 80),
      propertyType: clean(body.propertyType, 40), area: Number(body.area), listingMode: listingMode ?? "satilik",
      features: cleanFeatures(body.features), details: cleanDetails(body.details),
      ada: clean(body.ada, 20), parsel: clean(body.parsel, 20),
    };
    if (!listingMode) return response({ error: "Satılık mı kiralık mı olduğunu seçin." }, 400);
    if (!input.city || !input.district || !input.propertyType || !Number.isFinite(input.area) || input.area < 1 || input.area > 100000) return response({ error: "Geçerli konum ve metrekare bilgisi gerekli." }, 400);
    const modeWord = input.listingMode === "kiralik" ? "kiralık" : "satılık";
    const location = `${input.city} ${input.district} ${input.neighborhood}`;
    const queries = input.listingMode === "satilik"
      ? COMPARABLE_SITES.map((site) => `site:${site} ${location} ${input.propertyType} satılık m2 fiyat`)
      : [`${location} ${input.propertyType} ${modeWord} emlak ilanları fiyatları m2`];
    const signals = (await Promise.all(queries.map(search))).flat();
    const comparables = input.listingMode === "satilik" ? extractComparables(signals) : [];
    return response(estimate(input, signals, comparables));
  } catch (_error) {
    return response({ error: "Analiz servisine şu anda ulaşılamıyor." }, 500);
  }
});
