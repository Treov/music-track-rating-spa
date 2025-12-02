import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackRatings, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ratingId: string } }
) {
  try {
    const trackId = params.id;
    const ratingId = params.ratingId;

    // Validate track ID
    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json(
        {
          error: 'Valid track ID is required',
          code: 'INVALID_TRACK_ID'
        },
        { status: 400 }
      );
    }

    // Validate rating ID
    if (!ratingId || isNaN(parseInt(ratingId))) {
      return NextResponse.json(
        {
          error: 'Valid rating ID is required',
          code: 'INVALID_RATING_ID'
        },
        { status: 400 }
      );
    }

    // Parse request body safely
    let authUser;
    try {
      const text = await request.text();
      const body = text ? JSON.parse(text) : {};
      authUser = body.authUser;
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Validate authentication
    if (!authUser || !authUser.id) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const parsedTrackId = parseInt(trackId);
    const parsedRatingId = parseInt(ratingId);

    // Find the rating
    const rating = await db
      .select()
      .from(trackRatings)
      .where(eq(trackRatings.id, parsedRatingId))
      .limit(1);

    if (rating.length === 0) {
      return NextResponse.json(
        {
          error: 'Rating not found',
          code: 'RATING_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const ratingRecord = rating[0];

    // Verify rating belongs to the specified track
    if (ratingRecord.trackId !== parsedTrackId) {
      return NextResponse.json(
        {
          error: 'Rating does not belong to the specified track',
          code: 'TRACK_MISMATCH'
        },
        { status: 400 }
      );
    }

    // Check authorization
    const isOwner = ratingRecord.userId === authUser.id;
    const isSuperAdmin = authUser.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: 'Unauthorized to delete this rating',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Delete the rating
    await db
      .delete(trackRatings)
      .where(eq(trackRatings.id, parsedRatingId));

    // Decrement user's tracks_rated_count
    await db
      .update(users)
      .set({
        tracks_rated_count: sql`${users.tracks_rated_count} - 1`,
        updated_at: new Date().toISOString()
      })
      .where(eq(users.id, ratingRecord.userId));

    return NextResponse.json(
      {
        message: 'Rating deleted successfully',
        deletedRatingId: parsedRatingId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE rating error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}