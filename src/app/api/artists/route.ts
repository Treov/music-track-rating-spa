import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks } from '@/db/schema';
import { eq, like, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy'); // 'tracks' or 'rating'
    const minTracks = parseInt(searchParams.get('minTracks') ?? '0');
    const minRating = parseFloat(searchParams.get('minRating') ?? '0');

    let query = db
      .select({
        id: artists.id,
        name: artists.name,
        imageUrl: artists.imageUrl,
        verified: artists.verified,
        createdAt: artists.createdAt,
        updatedAt: artists.updatedAt,
        trackCount: sql<number>`cast(count(${tracks.id}) as integer)`,
        avgRating: sql<number>`ROUND(CAST(AVG((${tracks.vocals} + ${tracks.production} + ${tracks.lyrics} + ${tracks.originality} + ${tracks.vibe}) / 5.0) AS REAL), 2)`,
        totalRating: sql<number>`ROUND(CAST(SUM(${tracks.vocals} + ${tracks.production} + ${tracks.lyrics} + ${tracks.originality} + ${tracks.vibe}) / 5.0 AS REAL), 2)`,
      })
      .from(artists)
      .leftJoin(tracks, eq(artists.id, tracks.artistId))
      .groupBy(artists.id)
      .$dynamic();

    if (search) {
      query = query.where(like(artists.name, `%${search}%`));
    }

    // Apply sorting
    if (sortBy === 'tracks') {
      query = query.orderBy(desc(sql`cast(count(${tracks.id}) as integer)`));
    } else if (sortBy === 'rating') {
      query = query.orderBy(desc(sql`SUM(${tracks.vocals} + ${tracks.production} + ${tracks.lyrics} + ${tracks.originality} + ${tracks.vibe}) / 5.0`));
    } else {
      query = query.orderBy(desc(artists.createdAt));
    }

    const results = await query.limit(limit).offset(offset);

    // Apply filters after query (since HAVING is complex with drizzle)
    const filtered = results.filter(artist => {
      if (minTracks > 0 && artist.trackCount < minTracks) return false;
      if (minRating > 0 && (artist.totalRating === null || artist.totalRating < minRating)) return false;
      return true;
    });

    return NextResponse.json(filtered);
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
    const { name, imageUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    const existingArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.name, trimmedName))
      .limit(1);

    if (existingArtist.length > 0) {
      return NextResponse.json(
        { error: 'Artist with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const insertData = {
      name: trimmedName,
      imageUrl: imageUrl || null,
      verified: 0,
      createdAt: now,
      updatedAt: now,
    };

    const newArtist = await db.insert(artists).values(insertData).returning();

    return NextResponse.json(newArtist[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}