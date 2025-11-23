export interface Artist {
  id: number;
  name: string;
  imageUrl: string | null;
  verified: number;
  createdAt: string;
  updatedAt: string;
  trackCount?: number;
  avgRating?: number | null;
  totalRating?: number | null;
}

export interface Track {
  id: number;
  title: string;
  artistId: number;
  artistName?: string;
  albumArt: string | null;
  audioUrl: string | null;
  vocals: number;
  production: number;
  lyrics: number;
  originality: number;
  vibe: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackFormData {
  title: string;
  artistId: number;
  albumArt?: string;
  audioUrl?: string;
  vocals: number;
  production: number;
  lyrics: number;
  originality: number;
  vibe: number;
  notes?: string;
}