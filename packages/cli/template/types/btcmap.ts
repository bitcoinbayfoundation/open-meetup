export interface BTCMapPlace {
  id: number;
  lat: number;
  lon: number;
  icon: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  osm_id: string;
  phone?: string;
  website?: string;
  email?: string;
  description?: string;
  opening_hours?: string;
  image?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  payment_provider?: string;
  comments?: string;
  boosted_until?: string;
}
