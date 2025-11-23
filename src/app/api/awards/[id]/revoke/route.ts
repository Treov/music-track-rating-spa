import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAwards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate award ID from route params
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid award ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const awardId = parseInt(id);

    // Parse request body safely
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    const { userId, authUser } = body;

    // Authorization check - must be super_admin
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized: super_admin role required',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Validate userId from body
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);

    // Find userAward record matching both awardId and userId
    const existingAward = await db.select()
      .from(userAwards)
      .where(
        and(
          eq(userAwards.awardId, awardId),
          eq(userAwards.userId, userIdInt)
        )
      )
      .limit(1);

    if (existingAward.length === 0) {
      return NextResponse.json(
        {
          error: 'Award is not assigned to this user',
          code: 'AWARD_NOT_ASSIGNED'
        },
        { status: 404 }
      );
    }

    // Delete the userAward record
    const revokedAward = await db.delete(userAwards)
      .where(
        and(
          eq(userAwards.awardId, awardId),
          eq(userAwards.userId, userIdInt)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Award revoked successfully',
        data: revokedAward[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE /api/awards/[id]/revoke error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}