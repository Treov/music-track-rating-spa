import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks, artists } from '@/db/schema';
import { eq, like } from 'drizzle-orm';

// Configure runtime for Next.js 15 App Router
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db
      .select({
        id: tracks.id,
        title: tracks.title,
        artistId: tracks.artistId,
        albumArt: tracks.albumArt,
        audioUrl: tracks.audioUrl,
        vocals: tracks.vocals,
        production: tracks.production,
        lyrics: tracks.lyrics,
        originality: tracks.originality,
        vibe: tracks.vibe,
        notes: tracks.notes,
        createdAt: tracks.createdAt,
        updatedAt: tracks.updatedAt,
        artistName: artists.name,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id));

    if (search) {
      query = query.where(like(tracks.title, `%${search}%`));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      artistId,
      albumArt,
      audioUrl,
      vocals,
      production,
      lyrics,
      originality,
      vibe,
      notes,
    } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        {
          error: 'Title is required and must be a non-empty string',
          code: 'INVALID_TITLE',
        },
        { status: 400 }
      );
    }

    if (!artistId || typeof artistId !== 'number' || !Number.isInteger(artistId)) {
      return NextResponse.json(
        {
          error: 'Valid artist ID is required',
          code: 'INVALID_ARTIST_ID',
        },
        { status: 400 }
      );
    }

    const ratingFields = [
      { name: 'vocals', value: vocals },
      { name: 'production', value: production },
      { name: 'lyrics', value: lyrics },
      { name: 'originality', value: originality },
      { name: 'vibe', value: vibe },
    ];

    for (const field of ratingFields) {
      if (
        field.value === undefined ||
        field.value === null ||
        typeof field.value !== 'number' ||
        !Number.isInteger(field.value) ||
        field.value < 0 ||
        field.value > 10
      ) {
        return NextResponse.json(
          {
            error: `${field.name} must be an integer between 0 and 10`,
            code: 'INVALID_RATING',
          },
          { status: 400 }
        );
      }
    }

    const artistExists = await db
      .select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artistExists.length === 0) {
      return NextResponse.json(
        {
          error: 'Artist not found',
          code: 'ARTIST_NOT_FOUND',
        },
        { status: 400 }
      );
    }

    // Check for duplicate track (same title and artist)
    const duplicateTrack = await db
      .select()
      .from(tracks)
      .where(eq(tracks.artistId, artistId))
      .limit(100); // Get all tracks for this artist
    
    const titleLower = title.trim().toLowerCase();
    const isDuplicate = duplicateTrack.some(
      track => track.title.toLowerCase() === titleLower
    );

    if (isDuplicate) {
      return NextResponse.json(
        {
          error: 'Track with this title already exists for this artist',
          code: 'DUPLICATE_TRACK',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newTrack = await db
      .insert(tracks)
      .values({
        title: title.trim(),
        artistId,
        albumArt: albumArt || null,
        audioUrl: audioUrl || null,
        vocals,
        production,
        lyrics,
        originality,
        vibe,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newTrack[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}