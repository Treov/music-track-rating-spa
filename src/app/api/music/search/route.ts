import { NextRequest, NextResponse } from 'next/server';
import { searchSpotifyTracks } from '@/lib/music-api/spotify';
import { searchSoundCloudTracks } from '@/lib/music-api/soundcloud';
import { UnifiedTrack } from '@/lib/music-api/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const requests: Map<string, number[]> = new Map();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const userRequests = requests.get(clientIp) || [];
  const recentRequests = userRequests.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  recentRequests.push(now);
  requests.set(clientIp, recentRequests);
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Превышен лимит запросов. Максимум 20 запросов в минуту.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const platformsParam = searchParams.get('platforms');
    const platforms = platformsParam?.split(',') || ['spotify', 'soundcloud'];
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Запрос должен содержать минимум 2 символа' },
        { status: 400 }
      );
    }

    const results: { platform: string; tracks: UnifiedTrack[] }[] = [];

    // Fetch from requested platforms
    for (const platform of platforms) {
      try {
        let tracks: any[] = [];

        switch (platform) {
          case 'spotify':
            tracks = await searchSpotifyTracks(query, limit);
            const unifiedSpotifyTracks: UnifiedTrack[] = tracks.map((track) => ({
              platform: 'spotify' as const,
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              artworkUrl: track.albumArt,
              duration: Math.round(track.durationMs / 1000),
              previewUrl: track.previewUrl,
              externalUrl: track.externalUrl,
            }));
            results.push({
              platform: 'spotify',
              tracks: unifiedSpotifyTracks,
            });
            break;

          case 'soundcloud':
            tracks = await searchSoundCloudTracks(query, limit);
            const unifiedSoundCloudTracks: UnifiedTrack[] = tracks.map((track) => ({
              platform: 'soundcloud' as const,
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              artworkUrl: track.albumArt || '',
              duration: Math.round(track.durationMs / 1000),
              streamUrl: track.streamUrl,
              externalUrl: track.externalUrl,
            }));
            results.push({
              platform: 'soundcloud',
              tracks: unifiedSoundCloudTracks,
            });
            break;

          case 'vk':
          case 'yandex':
            // Skip silently if not configured
            console.log(`${platform} not configured, skipping...`);
            break;

          default:
            console.log(`Unknown platform: ${platform}`);
        }
      } catch (error) {
        console.error(`Error searching ${platform}:`, error);
        // Continue with other platforms even if one fails
      }
    }

    return NextResponse.json(
      {
        query,
        results,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}