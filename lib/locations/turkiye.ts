export interface TurkeyLocation { id: number; name: string; provinceId?: number; districtId?: number; }

import { supabase } from '@/lib/supabase/client';

async function tkgmRequest(body: Record<string, unknown>): Promise<TurkeyLocation[]> {
  const { data, error } = await supabase.functions.invoke('parcel-lookup', { body });
  if (error || data?.error) throw new Error(data?.error ?? 'TKGM istek hatası');
  return (data as { locations: TurkeyLocation[] }).locations ?? [];
}

export function getProvinces(): Promise<TurkeyLocation[]> {
  return tkgmRequest({ mode: 'ilListe' });
}

export function getDistricts(provinceId: number): Promise<TurkeyLocation[]> {
  return tkgmRequest({ mode: 'ilceListe', ilId: provinceId });
}

export function getNeighborhoods(districtId: number): Promise<TurkeyLocation[]> {
  return tkgmRequest({ mode: 'mahalleListe', ilceId: districtId });
}
