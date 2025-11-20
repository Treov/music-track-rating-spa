import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks } from '@/db/schema';
import { eq, like, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db
      .select({
        id: artists.id,
        name: artists.name,
        imageUrl: artists.imageUrl,
        createdAt: artists.createdAt,
        updatedAt: artists.updatedAt,
        trackCount: sql<number>`cast(count(${tracks.id}) as integer)`,
      })
      .from(artists)
      .leftJoin(tracks, eq(artists.id, tracks.artistId))
      .groupBy(artists.id)
      .$dynamic();

    if (search) {
      query = query.where(like(artists.name, `%${search}%`));
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
    const { name, imageUrl } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    // Trim and validate name is not empty
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    // Check for duplicate name
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

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      name: trimmedName,
      imageUrl: imageUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert new artist
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