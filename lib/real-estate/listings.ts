import { type Listing, type ListingFilters } from './types';
import { commercialPropertyTypes, GENERAL_COMMERCIAL_TYPE } from './property-types';

const apartmentImages = [
  'https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/8082227/pexels-photo-8082227.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/7173666/pexels-photo-7173666.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

export const listings: Listing[] = [
  { id: '1', title: 'Boğaz manzaralı, yüksek kira getirili rezidans', city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Kuruçeşme', type: 'Daire', price: 18500000, area: 185, rooms: '4+1', floor: '12. Kat', image: apartmentImages[0], gallery: apartmentImages, views: 12840, likes: 642, comments: 38, isFeatured: true, sellerType: 'agent', agent: { name: 'Derya Aksoy', office: 'Aksoy Gayrimenkul', initials: 'DA', verified: true }, features: ['Boğaz manzarası', 'Akıllı ev sistemi', 'Otopark', '7/24 güvenlik'], description: 'Kuruçeşme sahil hattında, gün ışığı alan ve modern mimariyle tasarlanmış prestijli bir rezidans dairesi.', coordinates: { lat: 41.064, lng: 29.036 }, status: 'active' },
];

export function filterListings(items: Listing[], filters: ListingFilters): Listing[] {
  const min = Number(filters.minPrice) || 0;
  const max = Number(filters.maxPrice) || Number.POSITIVE_INFINITY;
  const query = filters.search.trim().toLocaleLowerCase('tr-TR');
  const location = filters.location.trim().toLocaleLowerCase('tr-TR');
  return items.filter((item) => {
    const matchesQuery = !query || `${item.title} ${item.city} ${item.district} ${item.neighborhood}`.toLocaleLowerCase('tr-TR').includes(query);
    const matchesLocation = !location || `${item.city} ${item.district} ${item.neighborhood}`.toLocaleLowerCase('tr-TR').includes(location);
    const matchesAda = !filters.ada || (item.ada ?? '') === filters.ada;
    const matchesParsel = !filters.parsel || (item.parsel ?? '') === filters.parsel;
    const matchesCommercial = filters.type === GENERAL_COMMERCIAL_TYPE && commercialPropertyTypes.includes(item.type as typeof commercialPropertyTypes[number]);
    const matchesType = filters.type === 'Tümü' || item.type === filters.type || matchesCommercial;
    return matchesQuery && matchesLocation && matchesType && matchesAda && matchesParsel && item.price >= min && item.price <= max;
  });
}

export async function uploadPropertyImage(file: File): Promise<string> {
  // Production: compress to WebP in the browser, request a signed upload URL, then send to Cloudflare R2/S3.
  return URL.createObjectURL(file);
}

export async function fetchListingsByBounds(bounds: { north: number; south: number; east: number; west: number }): Promise<Listing[]> {
  // Production: replace this mock with a Supabase/PostgreSQL bounding-box query.
  return listings.filter(({ coordinates }) => coordinates !== null && coordinates.lat <= bounds.north && coordinates.lat >= bounds.south && coordinates.lng <= bounds.east && coordinates.lng >= bounds.west);
}
