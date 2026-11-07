'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TURKEY_CENTER: [number, number] = [39.0, 35.5];
const TURKEY_BOUNDS: L.LatLngBoundsLiteral = [
  [35.5, 25.5],
  [42.5, 45.0],
];

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const parcelIcon = L.divIcon({
  className: 'parcel-marker',
  html: `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="14" fill="#3b82f6" stroke="#fff" stroke-width="2.5"/>
    <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="sans-serif">P</text>
  </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export function TurkeyMap({
  latitude,
  longitude,
  onPick,
  markerType = 'default',
  polygon,
}: {
  latitude?: number | null;
  longitude?: number | null;
  onPick: (lat: number, lng: number) => void;
  markerType?: 'default' | 'parcel';
  polygon?: { lat: number; lng: number }[] | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasPoint = Boolean(latitude && longitude);
    const map = L.map(containerRef.current, {
      center: hasPoint ? [latitude!, longitude!] : TURKEY_CENTER,
      zoom: hasPoint ? 14 : 6,
      maxBounds: TURKEY_BOUNDS,
      maxBoundsViscosity: 0.8,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap katkıda bulunanları',
      maxZoom: 19,
    }).addTo(map);

    if (hasPoint) {
      const icon = markerType === 'parcel' ? parcelIcon : markerIcon;
      markerRef.current = L.marker([latitude!, longitude!], { icon }).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = markerType === 'parcel' ? parcelIcon : markerIcon;
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
      onPickRef.current(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      polygonRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    mapRef.current.invalidateSize();
    mapRef.current.setView([latitude, longitude], 16);
    const icon = markerType === 'parcel' ? parcelIcon : markerIcon;
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapRef.current);
    }
  }, [latitude, longitude, markerType]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (polygonRef.current) {
      mapRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    if (polygon && polygon.length > 2) {
      const latlngs: L.LatLngExpression[] = polygon.map((pt) => [pt.lat, pt.lng]);
      polygonRef.current = L.polygon(latlngs, {
        color: '#3b82f6',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
      }).addTo(mapRef.current);
    }
  }, [polygon]);

  return <div ref={containerRef} className="h-full w-full" />;
}
