export interface Artist {
  id: number;
  name: string;
  slug: string;
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
  quality: number;
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
  quality: number;
  vibe: number;
  notes?: string;
}

export interface TrackRating {
  id: number;
  trackId: number;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  vocals: number;
  production: number;
  lyrics: number;
  quality: number;
  vibe: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}