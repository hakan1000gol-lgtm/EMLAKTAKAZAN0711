import type { PropertyType } from './property-types';
import { arsaPropertyTypes, konutPropertyTypes } from './property-types';

export const NOT_SPECIFIED = 'Belirtilmedi';

export type FeatureField = {
  key: string;
  label: string;
  options: string[];
  multi?: boolean;
  required?: boolean;
};

type FeatureGroup = 'konut' | 'arsa' | 'ticari';

const buildingAge = ['Bina yok', '0 (Yeni)', '1', '2', '3', '4', '5', '6-10 arası', '11-15 arası', '16-20 arası', '21 ve üzeri'];
const buildingFloorCountOptions = [...Array.from({ length: 51 }, (_, i) => String(i)), '+50'];
const yesNo = ['Evet', 'Hayır'];
const commonUse = ['Boş', 'Kiracı var', 'Mülk sahibi oturuyor'];
const titleDeed = ['Kat mülkiyetli', 'Kat irtifaklı', 'Hisseli tapu', 'Arsa tapulu', 'Tarla tapulu', 'Kooperatif hisseli', 'Müstaksel'];
const seller = ['Sahibinden', 'Emlak ofisinden', 'İnşaat firmasından'];
const heating = ['Klima', 'Kombi (doğalgaz)', 'Merkezi sistem', 'Yerden ısıtma', 'Soba', 'Şömine', 'Isı pompası', 'Yok'];
const neighborhood = ['Alışveriş merkezi', 'Cami', 'Denize sıfır', 'Eczane', 'Eğlence merkezi', 'İlkokul-Ortaokul', 'Lise', 'Market', 'Park', 'Plaj', 'Sağlık ocağı', 'Semt pazarı', 'Şehir merkezi'];
const transport = ['Anayol', 'Cadde', 'Dolmuş', 'Minibüs', 'Otobüs durağı', 'Sahil', 'Metro', 'Tramvay', 'Metrobüs'];
const view = ['Deniz', 'Doğa', 'Havuz', 'Park & yeşil alan', 'Şehir', 'Boğaz'];
const takasOptions = ['Evet', 'Hayır'];
const facadeOptions = ['Kuzey', 'Güney', 'Doğu', 'Batı'];

// Ortak konut iç özellikleri
const interiorFeatures = ['ADSL', 'Ahşap doğrama', 'Amerikan kapı', 'Ankastre fırın', 'Boyalı', 'Çelik kapı', 'Duşakabin', 'Ebeveyn banyosu', 'Fırın', 'Gömme dolap', 'Görüntülü diyafon', 'Kiler', 'Kombi (doğalgaz)', 'Laminat parke', 'Panjur/Jaluzi', 'Set üstü ocak', 'Spot aydınlatma', 'Şömine', 'Teras', 'Vestiyer'];
const exteriorFeatures = ['Isı yalıtımı', 'Otopark', 'Uydu', 'Yüzme havuzu (açık)', 'Yüzme havuzu (kapalı)', 'Bahçe', 'Kapıcı', 'Güvenlik', 'Jeneratör'];

// === DAİRE / REZİDANS / YALI DAIRESI / APARTMAN DAIRESI ===
const apartmentFields: FeatureField[] = [
  { key: 'Oda sayısı', label: 'Oda sayısı', options: ['1+0', '1+1', '2+0', '2+1', '2+2', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2', '6+1', '7+1', '8+1', 'Dubleks', 'Tripleks', 'Stüdyo', 'Diğer'], required: true },
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Bulunduğu kat', label: 'Bulunduğu kat', options: ['Zemin', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16-20', '21-25', '26-30', '31-40', '41-50', '+50', 'Çatı katı', 'Bahçe katı', 'Yüksek giriş', 'Ara kat', 'Giriş katı'] },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Banyo sayısı', label: 'Banyo sayısı', options: ['1', '2', '3', '4', '5+'] },
  { key: 'Mutfak', label: 'Mutfak', options: ['Kapalı (ayrı)', 'Açık (Amerikan)', 'Ankastre', 'Yok'] },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark', 'Otopark (site)'] },
  { key: 'Eşyalı', label: 'Eşyalı', options: yesNo },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Site içerisinde', label: 'Site içerisinde', options: yesNo },
  { key: 'Aidat', label: 'Aidat (TL/ay)', options: ['Yok', '0-500', '500-1000', '1000-2000', '2000-4000', '4000+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Engelli ve yaşlıya uygun', label: 'Engelli ve yaşlıya uygun', options: yesNo },
  { key: 'Cephe', label: 'Cephe', options: facadeOptions, multi: true },
  { key: 'İç özellikler', label: 'İç özellikler', multi: true, options: interiorFeatures },
  { key: 'Dış özellikler', label: 'Dış özellikler', multi: true, options: exteriorFeatures },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
];

// === VİLLA / MÜSTAKİL EV / ÇİFTLİK EVİ / KÖŞK & KONAK / YALI ===
const villaFields: FeatureField[] = [
  { key: 'Oda sayısı', label: 'Oda sayısı', options: ['2+1', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2', '6+1', '6+2', '7+1', 'Dubleks', 'Tripleks', 'Daire içinde dubleks', 'Diğer'], required: true },
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: ['1', '2', '3', '4', '5+'] },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Banyo sayısı', label: 'Banyo sayısı', options: ['1', '2', '3', '4', '5+'] },
  { key: 'Mutfak', label: 'Mutfak', options: ['Kapalı (ayrı)', 'Açık (Amerikan)', 'Ankastre', 'Yok'] },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark', 'Garaj'] },
  { key: 'Eşyalı', label: 'Eşyalı', options: yesNo },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Site içerisinde', label: 'Site içerisinde', options: yesNo },
  { key: 'Aidat', label: 'Aidat (TL/ay)', options: ['Yok', '0-500', '500-1000', '1000-2000', '2000-4000', '4000+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Engelli ve yaşlıya uygun', label: 'Engelli ve yaşlıya uygun', options: yesNo },
  { key: 'Bahçe', label: 'Bahçe', options: ['Yok', 'Ortak', 'Özel', 'Geniş'] },
  { key: 'Bahçe alanı', label: 'Bahçe alanı (m²)', options: ['Yok', '0-50', '50-100', '100-250', '250-500', '500-1000', '1000+'] },
  { key: 'Cephe', label: 'Cephe', options: facadeOptions, multi: true },
  { key: 'İç özellikler', label: 'İç özellikler', multi: true, options: interiorFeatures },
  { key: 'Dış özellikler', label: 'Dış özellikler', multi: true, options: exteriorFeatures },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
];

// === YAZLIK / BUNGALOW / TINY HOUSE / GÜNLÜK KİRARIK ===
const holidayFields: FeatureField[] = [
  { key: 'Oda sayısı', label: 'Oda sayısı', options: ['1+0', '1+1', '2+1', '3+1', 'Stüdyo', 'Bungalow', 'Diğer'] },
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Banyo sayısı', label: 'Banyo sayısı', options: ['1', '2', '3+'] },
  { key: 'Mutfak', label: 'Mutfak', options: ['Kapalı (ayrı)', 'Açık (Amerikan)', 'Yok'] },
  { key: 'Eşyalı', label: 'Eşyalı', options: yesNo },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: ['Boş', 'Kiracı var', 'Mülk sahibi oturuyor', 'Günlük kiralık'] },
  { key: 'Site içerisinde', label: 'Site içerisinde', options: yesNo },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Bahçe', label: 'Bahçe', options: ['Yok', 'Ortak', 'Özel', 'Geniş'] },
  { key: 'Bahçe alanı', label: 'Bahçe alanı (m²)', options: ['Yok', '0-50', '50-100', '100-250', '250-500', '500+'] },
  { key: 'Cephe', label: 'Cephe', options: facadeOptions, multi: true },
  { key: 'İç özellikler', label: 'İç özellikler', multi: true, options: interiorFeatures },
  { key: 'Dış özellikler', label: 'Dış özellikler', multi: true, options: [...exteriorFeatures, 'Doğa yürüyüş rotası', 'Kamp ateşi alanı'] },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
];

// === KOOPERATİF / DEVRE MÜLK ===
const cooperativeFields: FeatureField[] = [
  { key: 'Oda sayısı', label: 'Oda sayısı', options: ['1+0', '1+1', '2+1', '3+1', 'Stüdyo', 'Diğer'] },
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Banyo sayısı', label: 'Banyo sayısı', options: ['1', '2', '3+'] },
  { key: 'Eşyalı', label: 'Eşyalı', options: yesNo },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Site içerisinde', label: 'Site içerisinde', options: yesNo },
  { key: 'Aidat', label: 'Aidat (TL/ay)', options: ['Yok', '0-500', '500-1000', '1000-2000', '2000-4000', '4000+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: ['Kooperatif hisseli', 'Kat mülkiyetli', 'Hisseli tapu'] },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Cephe', label: 'Cephe', options: facadeOptions, multi: true },
  { key: 'İç özellikler', label: 'İç özellikler', multi: true, options: interiorFeatures },
  { key: 'Dış özellikler', label: 'Dış özellikler', multi: true, options: exteriorFeatures },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
];

// === ARSA / İMARSIZ / TARLA / BAĞ / BAHÇE ===
const landFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Üzerindeki bina yaşı', options: buildingAge, required: true },
  { key: 'İmar durumu', label: 'İmar durumu', options: ['Konut imarlı', 'Ticari imarlı', 'Konut+ticari imarlı', 'Sanayi imarlı', 'Turizm imarlı', 'Tarım arazisi', 'İmar planı yok', 'İmar değişikliği bekleniyor'] },
  { key: 'KAKS', label: 'KAKS (emsal)', options: ['0.20', '0.30', '0.40', '0.50', '0.75', '1.00', '1.50', '2.00', '2.50', '3.00', 'Belirtilmedi'] },
  { key: 'Gabari', label: 'Gabari (kat limiti)', options: ['1 kat', '2 kat', '3 kat', '4 kat', '5 kat', '6+ kat', 'Serbest', 'Belirtilmedi'] },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: ['Müstaksel', 'Arsa tapulu', 'Tarla tapulu', 'Hisseli tapu', 'Kooperatif hisseli'] },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Yola cephe', label: 'Yola cephe', options: yesNo },
  { key: 'Yola cephe genişliği', label: 'Yola cephe genişliği (m)', options: ['Yok', '0-5', '5-10', '10-20', '20-50', '50+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Kıymet takdiri', label: 'Kıymet takdiri yapıldı mı?', options: yesNo },
  { key: 'Ada no', label: 'Ada no', options: [] },
  { key: 'Parsel no', label: 'Parsel no', options: [] },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
  { key: 'Altyapı', label: 'Altyapı', multi: true, options: ['Elektrik', 'Su', 'Doğalgaz', 'Kanalizasyon', 'Telefon', 'Yol', 'Yok'] },
  { key: 'İmar durumu detayı', label: 'İmar durumu detayı', multi: true, options: ['Parselasyonu yapıldı', 'İmar planı onaylı', 'İmar değişikliği aşamasında', 'İmarsız', 'Yapı ruhsatı alındı', 'Yapı kullanma izni var'] },
];

// === OFİS / PLAZA / İŞ HANI / BÜRO ===
const officeFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Bulunduğu kat', label: 'Bulunduğu kat', options: ['Zemin', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11-15', '16-20', '21+', 'Çatı katı'] },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark'] },
  { key: 'Asansör', label: 'Asansör', options: ['Yok', 'Var (1)', 'Var (2+)', 'Yüksek hızlı'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Aidat', label: 'Aidat (TL/ay)', options: ['Yok', '0-500', '500-1000', '1000-2000', '2000-4000', '4000+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Cephe', label: 'Cephe', options: facadeOptions, multi: true },
  { key: 'İç özellikler', label: 'İç özellikler', multi: true, options: ['Klima', 'Laminat parke', 'Spot aydınlatma', 'Ankastre', 'Görüntülü diyafon', 'Çelik kapı', 'Panjur/Jaluzi', 'Jeneratör', 'Server odası', 'Bulutur'] },
  { key: 'Dış özellikler', label: 'Dış özellikler', multi: true, options: ['Otopark', 'Güvenlik', '7/24 erişim', 'Merkezi klima', 'Merkezi ısıtma', 'Kafe/Restoran', 'Toplantı salonu', 'Bank/Şube'] },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
];

// === DÜKKAN / SHOWROOM / RESTORAN / AVM ===
const shopFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Bulunduğu kat', label: 'Bulunduğu kat', options: ['Zemin', '1', '2', '3', '4', '5+', 'Bodrum', 'Çatı'] },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark'] },
  { key: 'Asansör', label: 'Asansör', options: ['Yok', 'Var (1)', 'Var (2+)'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Aidat', label: 'Aidat (TL/ay)', options: ['Yok', '0-500', '500-1000', '1000-2000', '2000-4000', '4000+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Cephe', label: 'Cephe', options: facadeOptions, multi: true },
  { key: 'Vitrin genişliği', label: 'Vitrin genişliği (m)', options: ['Yok', '0-3', '3-6', '6-10', '10-20', '20+'] },
  { key: 'Vitrin sayısı', label: 'Vitrin sayısı', options: ['Yok', '1', '2', '3', '4+'] },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
];

// === DEPO / FABRİKA / İMALATHANE / ATÖLYE ===
const industrialFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: ['1', '2', '3', '4', '5+'] },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Tır parkı', 'Kamyon parkı'] },
  { key: 'Asansör', label: 'Asansör (yük asansörü)', options: ['Yok', 'Var (1)', 'Var (2+)', 'Seyyar vinç'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Tavan yüksekliği', label: 'Tavan yüksekliği (m)', options: ['0-3', '3-5', '5-8', '8-12', '12+'] },
  { key: 'Muhit', label: 'Muhit', multi: true, options: [...neighborhood, 'OSB', 'Organize sanayi', 'Sanayi sitesi'] },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: [...transport, 'Tır yükleme', 'Kamyon yükleme'] },
  { key: 'Altyapı', label: 'Altyapı', multi: true, options: ['Elektrik (trafo)', 'Su', 'Doğalgaz', 'Kanalizasyon', 'Telefon', 'Yol', 'Yük rampası'] },
];

// === OTEL / BUTİK OTEL / TURİSTİK TESİS ===
const hotelFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Oda sayısı', label: 'Oda sayısı', options: ['1-10', '11-25', '26-50', '51-100', '101-200', '200+'] },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark'] },
  { key: 'Asansör', label: 'Asansör', options: ['Yok', 'Var (1)', 'Var (2+)'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: ['Boş', 'Kiracı var', 'Mülk sahibi oturuyor', 'Turistte'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Turizm belgesi', label: 'Turizm belgesi', options: ['Var', 'Yok', 'Başvuru aşamasında'] },
  { key: 'Muhit', label: 'Muhit', multi: true, options: [...neighborhood, 'Turistik bölge', 'Plaja yakın'] },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: [...transport, 'Havalimanı', 'Otobüs terminali'] },
  { key: 'Manzara', label: 'Manzara', multi: true, options: [...view, 'Turistik'] },
  { key: 'Tesis özellikleri', label: 'Tesis özellikleri', multi: true, options: ['Restoran', 'Bar', 'Havuz', 'SPA', 'Oturma alanı', 'Toplantı salonu', 'Bahçe', 'Çamaşırhane', 'Resepsiyon', 'Mini kütüphane'] },
];

// === AKARYAKIT İSTASYONU ===
const fuelStationFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Pompa sayısı', label: 'Pompa sayısı', options: ['1-2', '3-4', '5-8', '8+'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Muhit', label: 'Muhit', multi: true, options: [...neighborhood, 'Anayol üzeri', 'Otoyol çıkışı', 'Sanayi bölgesi'] },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: [...transport, 'Tır yükleme'] },
  { key: 'Tesis özellikleri', label: 'Tesis özellikleri', multi: true, options: ['Market', 'Kafe/Restoran', 'Oto yıkama', 'Lastik & servis', 'Müştemilat', 'Elektrik şarj istasyonu'] },
];

// === GARAJ & PARK YERİ / OTOPARK ===
const parkingFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Araş kapasitesi', label: 'Araş kapasitesi', options: ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
];

// === OKUL / SPOR TESİSİ / TOPLANTI SALONU / HAMAM SPA / PAZAR YERİ ===
const facilityFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark'] },
  { key: 'Asansör', label: 'Asansör', options: ['Yok', 'Var (1)', 'Var (2+)'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Tesis özellikleri', label: 'Tesis özellikleri', multi: true, options: ['Ses sistemi', 'Sahne', 'Soğutma', 'Isıtma', 'Güvenlik sistemi', 'Geniş bahçe', 'Soyunma odası', 'Duş', 'Çocuk parkı', 'Kafeterya'] },
];

// === BİNA / KOMPLE BİNA ===
const buildingFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Daire sayısı', label: 'Daire sayısı', options: ['1-5', '6-10', '11-20', '21-50', '51+'] },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark'] },
  { key: 'Asansör', label: 'Asansör', options: ['Yok', 'Var (1)', 'Var (2+)'] },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Aidat', label: 'Aidat (TL/ay)', options: ['Yok', '0-500', '500-1000', '1000-2000', '2000-4000', '4000+'] },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
  { key: 'Manzara', label: 'Manzara', multi: true, options: view },
];

// Tip bazlı alan eşleştirme
const typeFieldMap: Partial<Record<PropertyType, FeatureField[]>> = {
  'Daire': apartmentFields,
  'Rezidans': apartmentFields,
  'Yalı Dairesi': apartmentFields,
  'Apartman Dairesi': apartmentFields,
  'İş Hanı Katı & Ofisi': officeFields,
  'Plaza Katı & Ofisi': officeFields,
  'Rezidans Katı & Ofisi': officeFields,
  'Villa': villaFields,
  'Müstakil Ev': villaFields,
  'Çiftlik Evi': villaFields,
  'Köşk & Konak': villaFields,
  'Yalı': villaFields,
  'Yazlık': holidayFields,
  'Bungalow': holidayFields,
  'Tiny House': holidayFields,
  'Günlük Kiralık': holidayFields,
  'Kooperatif': cooperativeFields,
  'Devre Mülk': cooperativeFields,
  'Arsa': landFields,
  'İmarsız': landFields,
  'Tarla': landFields,
  'Bağ': landFields,
  'Bahçe': landFields,
  'Ofis': officeFields,
  'Plaza': officeFields,
  'İş Hanı': officeFields,
  'Büro': officeFields,
  'Dükkan': shopFields,
  'Showroom': shopFields,
  'Restoran': shopFields,
  'AVM': shopFields,
  'Depo': industrialFields,
  'Fabrika': industrialFields,
  'İmalathane': industrialFields,
  'Atölye': industrialFields,
  'Maden Ocağı': industrialFields,
  'Otel': hotelFields,
  'Butik Otel': hotelFields,
  'Turistik Tesis': hotelFields,
  'Akaryakıt İstasyonu': fuelStationFields,
  'Garaj & Park Yeri': parkingFields,
  'Otopark': parkingFields,
  'Okul': facilityFields,
  'Spor Tesisi': facilityFields,
  'Toplantı & Etkinlik Salonu': facilityFields,
  'Hamam, Sauna & Spa': facilityFields,
  'Pazar Yeri': facilityFields,
  'Bina': buildingFields,
  'Komple Bina': buildingFields,
  'Çiftlik': buildingFields,
};

// Varsayılan ticari alanlar (eşleşmeyen tipler için)
const defaultCommercialFields: FeatureField[] = [
  { key: 'Bina yaşı', label: 'Bina yaşı', options: buildingAge.slice(1), required: true },
  { key: 'Binadaki kat sayısı', label: 'Binadaki kat sayısı', options: buildingFloorCountOptions },
  { key: 'Isıtma', label: 'Isıtma', options: heating },
  { key: 'Otopark', label: 'Otopark', options: ['Yok', 'Açık otopark', 'Kapalı otopark', 'Açık+kapalı otopark'] },
  { key: 'Asansör', label: 'Asansör', options: yesNo },
  { key: 'Kullanım durumu', label: 'Kullanım durumu', options: commonUse },
  { key: 'Krediye uygun', label: 'Krediye uygun', options: yesNo },
  { key: 'Takas', label: 'Takas', options: takasOptions },
  { key: 'Tapu durumu', label: 'Tapu durumu', options: titleDeed },
  { key: 'Kimden', label: 'Kimden', options: seller },
  { key: 'Muhit', label: 'Muhit', multi: true, options: neighborhood },
  { key: 'Ulaşım', label: 'Ulaşım', multi: true, options: transport },
];

// Geriye dönük uyumluluk için eski grup alanları (featureGroupFor hâlâ kullanılıyor)
const residentialFields = apartmentFields;
const commercialFields = defaultCommercialFields;

const groupFields: Record<FeatureGroup, FeatureField[]> = {
  konut: residentialFields,
  arsa: landFields,
  ticari: commercialFields,
};

export function featureGroupFor(type: PropertyType): FeatureGroup {
  if ((arsaPropertyTypes as readonly string[]).includes(type)) return 'arsa';
  if ((konutPropertyTypes as readonly string[]).includes(type)) return 'konut';
  return 'ticari';
}

export function featureFieldsFor(type: PropertyType): FeatureField[] {
  return typeFieldMap[type] ?? groupFields[featureGroupFor(type)];
}

export function splitMultiValue(value: string | undefined): string[] {
  return value ? value.split(', ').filter(Boolean) : [];
}

export function specifiedFeatureDetails(type: PropertyType, values: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of featureFieldsFor(type)) {
    const value = values[field.key];
    if (value && value !== NOT_SPECIFIED) result[field.key] = value;
  }
  return result;
}

export function selectedFeatureTags(type: PropertyType, values: Record<string, string>): string[] {
  return featureFieldsFor(type).filter((field) => field.multi).flatMap((field) => splitMultiValue(values[field.key]));
}
