import { UnifiedTrack, MusicAPIError } from './types';

interface YandexTrackResponse {
  id: string;
  title: string;
  artists: Array<{ name: string }>;
  albums: Array<{ title: string; coverUri?: string }>;
  durationMs: number;
}

interface YandexSearchResponse {
  result: {
    tracks?: {
      results: YandexTrackResponse[];
    };
  };
}

/**
 * Search for tracks on Yandex Music
 * Note: This uses unofficial/public endpoints. For production use, consider official Yandex Music API with proper authentication.
 */
export async function searchYandexTracks(
  query: string,
  limit: number = 20
): Promise<UnifiedTrack[]> {
  try {
    // Using public Yandex Music search API
    const searchUrl = `https://music.yandex.ru/handlers/music-search.jsx?text=${encodeURIComponent(query)}&type=tracks&page=0`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new MusicAPIError(
        'yandex',
        `Search failed with status ${response.status}`,
        response.status
      );
    }

    const data: YandexSearchResponse = await response.json();
    const tracks = data.result?.tracks?.results || [];

    return tracks.slice(0, limit).map((track) => ({
      platform: 'yandex' as const,
      id: track.id.toString(),
      title: track.title || 'Unknown',
      artist: track.artists?.[0]?.name || 'Unknown',
      album: track.albums?.[0]?.title || 'Unknown',
      artworkUrl: track.albums?.[0]?.coverUri
        ? `https://${track.albums[0].coverUri.replace('%%', '400x400')}`
        : '/placeholder-album.png',
      duration: Math.floor((track.durationMs || 0) / 1000),
      previewUrl: null, // Yandex doesn't provide preview URLs in search
      streamUrl: null,
      externalUrl: `https://music.yandex.ru/album/${track.albums?.[0]?.id || ''}/track/${track.id}`,
    }));
  } catch (error) {
    if (error instanceof MusicAPIError) {
      throw error;
    }
    
    console.error('Yandex Music search error:', error);
    throw new MusicAPIError(
      'yandex',
      `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get track details from Yandex Music
 */
export async function getYandexTrackDetails(trackId: string): Promise<UnifiedTrack> {
  try {
    const detailsUrl = `https://music.yandex.ru/handlers/track.jsx?track=${trackId}`;
    
    const response = await fetch(detailsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new MusicAPIError(
        'yandex',
        `Failed to get track details with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    const track = data.track;

    return {
      platform: 'yandex',
      id: track.id.toString(),
      title: track.title || 'Unknown',
      artist: track.artists?.[0]?.name || 'Unknown',
      album: track.albums?.[0]?.title || 'Unknown',
      artworkUrl: track.albums?.[0]?.coverUri
        ? `https://${track.albums[0].coverUri.replace('%%', '400x400')}`
        : '/placeholder-album.png',
      duration: Math.floor((track.durationMs || 0) / 1000),
      previewUrl: null,
      streamUrl: null,
      externalUrl: `https://music.yandex.ru/album/${track.albums?.[0]?.id || ''}/track/${track.id}`,
    };
  } catch (error) {
    if (error instanceof MusicAPIError) {
      throw error;
    }
    
    console.error('Yandex Music track details error:', error);
    throw new MusicAPIError(
      'yandex',
      `Failed to get track details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
