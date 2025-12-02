import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackRatings, tracks, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;

    // Validate track ID
    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
        { status: 400 }
      );
    }

    const parsedTrackId = parseInt(trackId);

    // Parse request body
    const body = await request.json();
    const { userId, vocals, production, lyrics, quality, vibe, notes } = body;

    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);

    // Validate required rating fields are present
    if (
      vocals === undefined ||
      production === undefined ||
      lyrics === undefined ||
      quality === undefined ||
      vibe === undefined
    ) {
      return NextResponse.json(
        {
          error: 'All rating fields (vocals, production, lyrics, quality, vibe) are required',
          code: 'MISSING_RATING_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate rating values are integers
    if (
      !Number.isInteger(vocals) ||
      !Number.isInteger(production) ||
      !Number.isInteger(lyrics) ||
      !Number.isInteger(quality) ||
      !Number.isInteger(vibe)
    ) {
      return NextResponse.json(
        {
          error: 'All rating values must be integers',
          code: 'INVALID_RATING_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate rating values are between 0 and 10
    const ratingValues = [vocals, production, lyrics, quality, vibe];
    const invalidRatings = ratingValues.some((value) => value < 0 || value > 10);

    if (invalidRatings) {
      return NextResponse.json(
        {
          error: 'All rating values must be between 0 and 10',
          code: 'RATING_OUT_OF_RANGE',
        },
        { status: 400 }
      );
    }

    // Check if track exists
    const trackExists = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, parsedTrackId))
      .limit(1);

    if (trackExists.length === 0) {
      return NextResponse.json(
        { error: 'Track not found', code: 'TRACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedUserId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if user already rated this track
    const existingRating = await db
      .select()
      .from(trackRatings)
      .where(
        and(
          eq(trackRatings.trackId, parsedTrackId),
          eq(trackRatings.userId, parsedUserId)
        )
      )
      .limit(1);

    const currentTimestamp = new Date().toISOString();

    if (existingRating.length > 0) {
      // Update existing rating
      const updated = await db
        .update(trackRatings)
        .set({
          vocals,
          production,
          lyrics,
          quality,
          vibe,
          notes: notes || null,
          updatedAt: currentTimestamp,
        })
        .where(eq(trackRatings.id, existingRating[0].id))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new rating
      const newRating = await db
        .insert(trackRatings)
        .values({
          trackId: parsedTrackId,
          userId: parsedUserId,
          vocals,
          production,
          lyrics,
          quality,
          vibe,
          notes: notes || null,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
        .returning();

      // Increment user's tracks_rated_count
      await db
        .update(users)
        .set({
          tracks_rated_count: userExists[0].tracks_rated_count + 1,
          updated_at: currentTimestamp,
        })
        .where(eq(users.id, parsedUserId));

      return NextResponse.json(newRating[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/tracks/[id]/ratings error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;

    // Validate track ID
    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
        { status: 400 }
      );
    }

    const parsedTrackId = parseInt(trackId);

    // Check if track exists
    const trackExists = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, parsedTrackId))
      .limit(1);

    if (trackExists.length === 0) {
      return NextResponse.json(
        { error: 'Track not found', code: 'TRACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get all ratings for the track with user information
    const ratings = await db
      .select({
        id: trackRatings.id,
        trackId: trackRatings.trackId,
        userId: trackRatings.userId,
        username: users.username,
        displayName: users.display_name,
        avatarUrl: users.avatar_url,
        vocals: trackRatings.vocals,
        production: trackRatings.production,
        lyrics: trackRatings.lyrics,
        quality: trackRatings.quality,
        vibe: trackRatings.vibe,
        notes: trackRatings.notes,
        createdAt: trackRatings.createdAt,
        updatedAt: trackRatings.updatedAt,
      })
      .from(trackRatings)
      .leftJoin(users, eq(trackRatings.userId, users.id))
      .where(eq(trackRatings.trackId, parsedTrackId))
      .orderBy(desc(trackRatings.createdAt));

    return NextResponse.json(ratings, { status: 200 });
  } catch (error) {
    console.error('GET /api/tracks/[id]/ratings error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}