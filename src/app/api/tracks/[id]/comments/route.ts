import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackComments, tracks, users, guestUsers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;

    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
        { status: 400 }
      );
    }

    const trackIdNum = parseInt(trackId);

    const track = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackIdNum))
      .limit(1);

    if (track.length === 0) {
      return NextResponse.json(
        { error: 'Track not found', code: 'TRACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const comments = await db
      .select({
        id: trackComments.id,
        trackId: trackComments.trackId,
        userId: trackComments.userId,
        guestId: trackComments.guestId,
        comment: trackComments.comment,
        createdAt: trackComments.createdAt,
        updatedAt: trackComments.updatedAt,
        userDisplayName: users.display_name,
        username: users.username,
        userRole: users.role,
        guestDisplayName: guestUsers.displayName,
      })
      .from(trackComments)
      .leftJoin(users, eq(trackComments.userId, users.id))
      .leftJoin(guestUsers, eq(trackComments.guestId, guestUsers.id))
      .where(eq(trackComments.trackId, trackIdNum))
      .orderBy(desc(trackComments.createdAt));

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      trackId: comment.trackId,
      userId: comment.userId,
      guestId: comment.guestId,
      comment: comment.comment,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      displayName: comment.userId
        ? comment.userDisplayName || comment.username
        : comment.guestDisplayName,
      role: comment.userId ? comment.userRole : null,
    }));

    return NextResponse.json(formattedComments, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;

    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json(
        { error: 'Valid track ID is required', code: 'INVALID_TRACK_ID' },
        { status: 400 }
      );
    }

    const trackIdNum = parseInt(trackId);

    const body = await request.json();
    const { comment, userId, guestId } = body;

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required', code: 'MISSING_COMMENT' },
        { status: 400 }
      );
    }

    const hasUserId = userId !== undefined && userId !== null;
    const hasGuestId = guestId !== undefined && guestId !== null;

    if ((hasUserId && hasGuestId) || (!hasUserId && !hasGuestId)) {
      return NextResponse.json(
        { error: 'Provide either userId or guestId', code: 'INVALID_PARAMETERS' },
        { status: 400 }
      );
    }

    const track = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackIdNum))
      .limit(1);

    if (track.length === 0) {
      return NextResponse.json(
        { error: 'Track not found', code: 'TRACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (hasUserId) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    if (hasGuestId) {
      const guestUser = await db
        .select()
        .from(guestUsers)
        .where(eq(guestUsers.id, guestId))
        .limit(1);

      if (guestUser.length === 0) {
        return NextResponse.json(
          { error: 'Guest user not found', code: 'GUEST_USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    const now = new Date().toISOString();
    const insertData: any = {
      trackId: trackIdNum,
      comment: comment.trim(),
      createdAt: now,
      updatedAt: now,
    };

    if (hasUserId) {
      insertData.userId = userId;
      insertData.guestId = null;
    } else {
      insertData.guestId = guestId;
      insertData.userId = null;
    }

    const newComment = await db
      .insert(trackComments)
      .values(insertData)
      .returning();

    const commentWithDetails = await db
      .select({
        id: trackComments.id,
        trackId: trackComments.trackId,
        userId: trackComments.userId,
        guestId: trackComments.guestId,
        comment: trackComments.comment,
        createdAt: trackComments.createdAt,
        updatedAt: trackComments.updatedAt,
        userDisplayName: users.display_name,
        username: users.username,
        userRole: users.role,
        guestDisplayName: guestUsers.displayName,
      })
      .from(trackComments)
      .leftJoin(users, eq(trackComments.userId, users.id))
      .leftJoin(guestUsers, eq(trackComments.guestId, guestUsers.id))
      .where(eq(trackComments.id, newComment[0].id))
      .limit(1);

    const result = commentWithDetails[0];
    const responseComment = {
      id: result.id,
      trackId: result.trackId,
      userId: result.userId,
      guestId: result.guestId,
      comment: result.comment,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      displayName: result.userId
        ? result.userDisplayName || result.username
        : result.guestDisplayName,
      role: result.userId ? result.userRole : null,
    };

    return NextResponse.json(responseComment, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}