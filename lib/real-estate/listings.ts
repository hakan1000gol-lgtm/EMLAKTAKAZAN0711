import { type Listing, type ListingFilters } from './types';
import { commercialPropertyTypes, GENERAL_COMMERCIAL_TYPE } from './property-types';

export const listings: Listing[] = [];

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
  return URL.createObjectURL(file);
}

export async function fetchListingsByBounds(bounds: { north: number; south: number; east: number; west: number }): Promise<Listing[]> {
  return listings.filter(({ coordinates }) => coordinates !== null && coordinates.lat <= bounds.north && coordinates.lat >= bounds.south && coordinates.lng <= bounds.east && coordinates.lng >= bounds.west);
}
