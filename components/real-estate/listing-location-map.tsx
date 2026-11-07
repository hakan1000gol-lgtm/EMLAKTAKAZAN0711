'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parsePolygon } from '@/lib/real-estate/parcel-geometry';

const HIDDEN_AREA_RADIUS_METERS = Math.sqrt(1_000_000 / Math.PI);

export function ListingLocationMap({ lat, lng, hidden = false, parcelGeometry }: { lat: number; lng: number; hidden?: boolean; parcelGeometry?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const polygon = useMemo(() => parsePolygon(parcelGeometry), [parcelGeometry]);

  useEffect(() => {
    if (!containerRef.current) return;
    const zoom = hidden ? 13 : 15;
    const map = L.map(containerRef.current, { center: [lat, lng], zoom, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap katkıda bulunanları',
      maxZoom: 19,
    }).addTo(map);

    if (hidden) {
      L.circle([lat, lng], {
        radius: HIDDEN_AREA_RADIUS_METERS,
        color: '#3b82f6',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
      }).addTo(map);
      L.circleMarker([lat, lng], { radius: 4, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.5 }).addTo(map);
    } else {
      if (polygon && polygon.length > 2) {
        L.polygon(polygon.map((pt) => [pt.lat, pt.lng] as [number, number]), {
          color: '#3b82f6',
          weight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
        }).addTo(map);
      }
      L.circleMarker([lat, lng], { radius: 10, color: '#f43f68', fillColor: '#f43f68', fillOpacity: 0.85 }).addTo(map);
    }

    return () => { map.remove(); };
  }, [lat, lng, hidden, polygon]);

  return <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-2xl" />;
}
