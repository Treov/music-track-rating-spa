import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackLikes, tracks } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const trackId = parseInt(id);
    
    if (!trackId || isNaN(trackId)) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
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

    const track = await db.select()
      .from(tracks)
      .where(eq(tracks.id, trackId))
      .limit(1);

    if (track.length === 0) {
      return NextResponse.json(
        { error: 'Track not found', code: 'TRACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingLikeConditions = [eq(trackLikes.trackId, trackId)];
    if (userId) {
      existingLikeConditions.push(eq(trackLikes.userId, userId));
    } else {
      existingLikeConditions.push(eq(trackLikes.guestId, guestId));
    }

    const existingLike = await db.select()
      .from(trackLikes)
      .where(and(...existingLikeConditions))
      .limit(1);

    if (existingLike.length > 0) {
      return NextResponse.json(
        { error: 'Already liked', code: 'ALREADY_LIKED' },
        { status: 400 }
      );
    }

    const newLike = await db.insert(trackLikes)
      .values({
        trackId,
        userId: userId || null,
        guestId: guestId || null,
        createdAt: new Date().toISOString()
      })
      .returning();

    const totalLikesResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(trackLikes)
      .where(eq(trackLikes.trackId, trackId));

    const totalLikes = Number(totalLikesResult[0]?.count || 0);

    return NextResponse.json(
      { 
        ...newLike[0],
        totalLikes 
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
    const trackId = parseInt(id);
    
    if (!trackId || isNaN(trackId)) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const guestId = searchParams.get('guestId');

    const totalLikesResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(trackLikes)
      .where(eq(trackLikes.trackId, trackId));

    const count = Number(totalLikesResult[0]?.count || 0);

    let userLiked = false;

    if (userId || guestId) {
      const userLikeConditions = [eq(trackLikes.trackId, trackId)];
      
      if (userId) {
        userLikeConditions.push(eq(trackLikes.userId, parseInt(userId)));
      } else if (guestId) {
        userLikeConditions.push(eq(trackLikes.guestId, parseInt(guestId)));
      }

      const userLike = await db.select()
        .from(trackLikes)
        .where(and(...userLikeConditions))
        .limit(1);

      userLiked = userLike.length > 0;
    }

    return NextResponse.json({ count, userLiked }, { status: 200 });
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
    const trackId = parseInt(id);
    
    if (!trackId || isNaN(trackId)) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
        { status: 400 }
      );
    }

    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      body = {};
    }

    const { userId, guestId } = body;

    if ((!userId && !guestId) || (userId && guestId)) {
      return NextResponse.json(
        { error: 'Provide either userId or guestId', code: 'INVALID_PARAMETERS' },
        { status: 400 }
      );
    }

    const findLikeConditions = [eq(trackLikes.trackId, trackId)];
    if (userId) {
      findLikeConditions.push(eq(trackLikes.userId, userId));
    } else {
      findLikeConditions.push(eq(trackLikes.guestId, guestId));
    }

    const existingLike = await db.select()
      .from(trackLikes)
      .where(and(...findLikeConditions))
      .limit(1);

    if (existingLike.length === 0) {
      return NextResponse.json(
        { error: 'Like not found', code: 'LIKE_NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.delete(trackLikes)
      .where(and(...findLikeConditions));

    const totalLikesResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(trackLikes)
      .where(eq(trackLikes.trackId, trackId));

    const totalLikes = Number(totalLikesResult[0]?.count || 0);

    return NextResponse.json(
      { 
        message: 'Like removed successfully',
        totalLikes 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}