import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artistLikes, artists } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const artistId = parseInt(id);

    if (!artistId || isNaN(artistId)) {
      return NextResponse.json(
        { error: 'Valid artist ID is required', code: 'INVALID_ARTIST_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, guestId } = body;

    if ((!userId && !guestId) || (userId && guestId)) {
      return NextResponse.json(
        { error: 'Provide either userId or guestId', code: 'INVALID_PARAMETERS' },
        { status: 400 }
      );
    }

    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found', code: 'ARTIST_NOT_FOUND' },
        { status: 404 }
      );
    }

    const whereCondition = userId
      ? and(eq(artistLikes.artistId, artistId), eq(artistLikes.userId, userId))
      : and(eq(artistLikes.artistId, artistId), eq(artistLikes.guestId, guestId));

    const existingLike = await db.select()
      .from(artistLikes)
      .where(whereCondition)
      .limit(1);

    if (existingLike.length > 0) {
      return NextResponse.json(
        { error: 'Already liked', code: 'ALREADY_LIKED' },
        { status: 400 }
      );
    }

    const newLike = await db.insert(artistLikes)
      .values({
        artistId,
        userId: userId || null,
        guestId: guestId || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    const totalLikesResult = await db.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(artistLikes)
      .where(eq(artistLikes.artistId, artistId));

    const totalLikes = Number(totalLikesResult[0]?.count || 0);

    return NextResponse.json(
      {
        ...newLike[0],
        totalLikes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const artistId = parseInt(id);

    if (!artistId || isNaN(artistId)) {
      return NextResponse.json(
        { error: 'Valid artist ID is required', code: 'INVALID_ARTIST_ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const guestId = searchParams.get('guestId');

    const totalLikesResult = await db.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(artistLikes)
      .where(eq(artistLikes.artistId, artistId));

    const count = Number(totalLikesResult[0]?.count || 0);

    let userLiked = false;

    if (userId || guestId) {
      const whereCondition = userId
        ? and(eq(artistLikes.artistId, artistId), eq(artistLikes.userId, parseInt(userId)))
        : and(eq(artistLikes.artistId, artistId), eq(artistLikes.guestId, parseInt(guestId!)));

      const userLike = await db.select()
        .from(artistLikes)
        .where(whereCondition)
        .limit(1);

      userLiked = userLike.length > 0;
    }

    return NextResponse.json({
      count,
      userLiked,
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const artistId = parseInt(id);

    if (!artistId || isNaN(artistId)) {
      return NextResponse.json(
        { error: 'Valid artist ID is required', code: 'INVALID_ARTIST_ID' },
        { status: 400 }
      );
    }

    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { userId, guestId } = body;

    if ((!userId && !guestId) || (userId && guestId)) {
      return NextResponse.json(
        { error: 'Provide either userId or guestId', code: 'INVALID_PARAMETERS' },
        { status: 400 }
      );
    }

    const whereCondition = userId
      ? and(eq(artistLikes.artistId, artistId), eq(artistLikes.userId, userId))
      : and(eq(artistLikes.artistId, artistId), eq(artistLikes.guestId, guestId));

    const existingLike = await db.select()
      .from(artistLikes)
      .where(whereCondition)
      .limit(1);

    if (existingLike.length === 0) {
      return NextResponse.json(
        { error: 'Like not found', code: 'LIKE_NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.delete(artistLikes)
      .where(whereCondition)
      .returning();

    const totalLikesResult = await db.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(artistLikes)
      .where(eq(artistLikes.artistId, artistId));

    const totalLikes = Number(totalLikesResult[0]?.count || 0);

    return NextResponse.json({
      message: 'Like removed successfully',
      totalLikes,
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}