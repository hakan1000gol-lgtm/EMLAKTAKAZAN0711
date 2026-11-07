export interface ParcelPoint {
  lat: number;
  lng: number;
}

export function parseParcelArea(alan: string | null | undefined): number | null {
  if (!alan) return null;
  const normalized = alan.includes(',') ? alan.replace(/\./g, '').replace(',', '.') : alan;
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parsePolygon(geometryStr: string | null | undefined): ParcelPoint[] | null {
  if (!geometryStr) return null;
  try {
    const geom = JSON.parse(geometryStr);
    if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
      const ring = geom.coordinates[0];
      if (!Array.isArray(ring)) return null;
      return ring.map((pt: number[]) => ({ lng: pt[0], lat: pt[1] }));
    }
    if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
      const ring = geom.coordinates[0]?.[0];
      if (!Array.isArray(ring)) return null;
      return ring.map((pt: number[]) => ({ lng: pt[0], lat: pt[1] }));
    }
  } catch {
    return null;
  }
  return null;
}
