import { MusicAPIError } from './types';

interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    username: string;
  };
  artwork_url: string | null;
  duration: number;
  permalink_url: string;
  stream_url?: string;
}

interface SoundCloudSearchResponse {
  collection: SoundCloudTrack[];
}

export async function searchSoundCloudTracks(query: string, limit: number = 10) {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;

  if (!clientId) {
    throw new MusicAPIError('soundcloud', 'SoundCloud API credentials not configured');
  }

  try {
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&limit=${limit}&client_id=${clientId}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new MusicAPIError('soundcloud', 'Invalid API credentials', 401);
      }
      throw new MusicAPIError('soundcloud', `API error: ${response.statusText}`, response.status);
    }

    const data: SoundCloudSearchResponse = await response.json();

    return data.collection.map((track) => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.user.username,
      album: '',
      albumArt: track.artwork_url ? track.artwork_url.replace('-large', '-t500x500') : null,
      durationMs: track.duration,
      streamUrl: track.stream_url,
      externalUrl: track.permalink_url,
    }));
  } catch (error) {
    if (error instanceof MusicAPIError) {
      throw error;
    }
    throw new MusicAPIError('soundcloud', error instanceof Error ? error.message : 'Unknown error');
  }
}
