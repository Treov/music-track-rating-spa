import { SpotifyApi } from '@spotify/web-api-ts-sdk';

type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  externalUrl: string;
  durationMs: number;
};

let spotifyClient: SpotifyApi | null = null;

export async function initSpotify(): Promise<SpotifyApi> {
  if (spotifyClient) return spotifyClient;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials');
  }

  spotifyClient = SpotifyApi.withClientCredentials(clientId, clientSecret);
  return spotifyClient;
}

export async function searchSpotifyTracks(
  query: string,
  limit: number = 20
): Promise<SpotifyTrack[]> {
  try {
    const client = await initSpotify();
    const results = await client.search(query, ['track'], undefined, limit);

    return (results.tracks?.items || []).map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      album: track.album?.name || 'Unknown',
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url,
      externalUrl: track.external_urls.spotify,
      durationMs: track.duration_ms || 0,
    }));
  } catch (error) {
    console.error('Spotify search error:', error);
    throw new Error(`Spotify search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSpotifyTrackDetails(trackId: string): Promise<SpotifyTrack> {
  try {
    const client = await initSpotify();
    const track = await client.tracks.get(trackId);

    return {
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      album: track.album?.name || 'Unknown',
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url,
      externalUrl: track.external_urls.spotify,
      durationMs: track.duration_ms || 0,
    };
  } catch (error) {
    console.error('Spotify track details error:', error);
    throw new Error(`Failed to get Spotify track details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
