import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { awards, users, userAwards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const awardId = params.id;

    // Validate award ID from route params
    if (!awardId || isNaN(parseInt(awardId))) {
      return NextResponse.json(
        {
          error: 'Valid award ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const parsedAwardId = parseInt(awardId);

    // Parse request body
    const body = await request.json();
    const { userId, authUser } = body;

    // Authorization check - must be super_admin
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized. Super admin access required',
          code: 'UNAUTHORIZED',
        },
        { status: 403 }
      );
    }

    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID',
        },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);

    // Check if award exists
    const award = await db
      .select()
      .from(awards)
      .where(eq(awards.id, parsedAwardId))
      .limit(1);

    if (award.length === 0) {
      return NextResponse.json(
        {
          error: 'Award not found',
          code: 'AWARD_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedUserId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if user already has this award
    const existingUserAward = await db
      .select()
      .from(userAwards)
      .where(
        and(
          eq(userAwards.userId, parsedUserId),
          eq(userAwards.awardId, parsedAwardId)
        )
      )
      .limit(1);

    if (existingUserAward.length > 0) {
      return NextResponse.json(
        {
          error: 'User already has this award',
          code: 'AWARD_ALREADY_ASSIGNED',
        },
        { status: 400 }
      );
    }

    // Create userAwards record
    const currentTimestamp = new Date().toISOString();
    const newUserAward = await db
      .insert(userAwards)
      .values({
        userId: parsedUserId,
        awardId: parsedAwardId,
        assignedBy: authUser.id,
        assignedAt: currentTimestamp,
        createdAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newUserAward[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}