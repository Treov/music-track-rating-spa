import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackComments } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
    commentId: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: trackId, commentId } = await params;

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

    // Validate comment ID
    if (!commentId || isNaN(parseInt(commentId))) {
      return NextResponse.json(
        { 
          error: 'Valid comment ID is required',
          code: 'INVALID_COMMENT_ID' 
        },
        { status: 400 }
      );
    }

    // Parse request body safely
    let userId: number | undefined;
    let guestId: number | undefined;
    let authUser: { id: number; role: string } | undefined;

    try {
      const body = await request.json();
      userId = body.userId;
      guestId = body.guestId;
      authUser = body.authUser;
    } catch (error) {
      // Empty body or invalid JSON is acceptable for this endpoint
      // Continue with undefined values
    }

    // Query the comment by commentId
    const comment = await db.select()
      .from(trackComments)
      .where(eq(trackComments.id, parseInt(commentId)))
      .limit(1);

    // Check if comment exists
    if (comment.length === 0) {
      return NextResponse.json(
        { 
          error: 'Comment not found',
          code: 'COMMENT_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const foundComment = comment[0];

    // Verify comment belongs to the specified track
    if (foundComment.trackId !== parseInt(trackId)) {
      return NextResponse.json(
        { 
          error: 'Comment does not belong to this track',
          code: 'TRACK_MISMATCH' 
        },
        { status: 400 }
      );
    }

    // Check authorization - allow deletion if ANY of these conditions are true
    const isCommentOwnerViaUserId = userId !== undefined && foundComment.userId === userId;
    const isCommentOwnerViaGuestId = guestId !== undefined && foundComment.guestId === guestId;
    const isSuperAdmin = authUser && authUser.role === 'super_admin';
    const isAdmin = authUser && authUser.role === 'admin';
    const isModerator = authUser && authUser.role === 'moderator';

    const isAuthorized = isCommentOwnerViaUserId || 
                        isCommentOwnerViaGuestId || 
                        isSuperAdmin || 
                        isAdmin || 
                        isModerator;

    if (!isAuthorized) {
      return NextResponse.json(
        { 
          error: 'Unauthorized to delete this comment',
          code: 'UNAUTHORIZED' 
        },
        { status: 403 }
      );
    }

    // Delete the comment
    const deleted = await db.delete(trackComments)
      .where(eq(trackComments.id, parseInt(commentId)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Comment deleted successfully',
        comment: deleted[0]
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