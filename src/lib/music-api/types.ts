export type MusicPlatform = 'spotify' | 'soundcloud' | 'vk' | 'yandex';

export interface UnifiedTrack {
  platform: MusicPlatform;
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  duration: number;
  previewUrl?: string | null;
  streamUrl?: string | null;
  externalUrl?: string;
}

export interface SearchResult {
  tracks: UnifiedTrack[];
  platform: MusicPlatform;
  query: string;
  timestamp: number;
}

export class MusicAPIError extends Error {
  constructor(
    public platform: MusicPlatform,
    message: string,
    public statusCode?: number
  ) {
    super(`[${platform.toUpperCase()}] ${message}`);
    this.name = 'MusicAPIError';
  }
}
