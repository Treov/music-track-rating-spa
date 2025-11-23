import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Query user with LEFT JOIN to userPermissions
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        role: users.role,
        isBanned: users.isBanned,
        tracksRatedCount: users.tracksRatedCount,
        tracksAddedCount: users.tracksAddedCount,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        permissions: {
          id: userPermissions.id,
          userId: userPermissions.userId,
          canEditOthersRatings: userPermissions.canEditOthersRatings,
          canDeleteOthersRatings: userPermissions.canDeleteOthersRatings,
          canVerifyArtists: userPermissions.canVerifyArtists,
          canAddArtists: userPermissions.canAddArtists,
          canDeleteArtists: userPermissions.canDeleteArtists,
          createdAt: userPermissions.createdAt,
          updatedAt: userPermissions.updatedAt,
        },
      })
      .from(users)
      .leftJoin(userPermissions, eq(users.id, userPermissions.userId))
      .where(eq(users.id, userId))
      .limit(1);

    // Return 404 if user not found
    if (userResult.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Return user object with permissions, passwordHash is already excluded
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { displayName, avatarUrl, bio } = body;

    // Validate displayName: optional, max 100 characters
    if (displayName !== undefined && displayName !== null) {
      if (typeof displayName !== 'string') {
        return NextResponse.json(
          {
            error: 'Display name must be a string',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      if (displayName.length > 100) {
        return NextResponse.json(
          {
            error: 'Display name must not exceed 100 characters',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
    }

    // Validate avatarUrl: optional, must be valid URL format or null
    if (avatarUrl !== undefined && avatarUrl !== null) {
      if (typeof avatarUrl !== 'string') {
        return NextResponse.json(
          {
            error: 'Avatar URL must be a string',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      try {
        new URL(avatarUrl);
      } catch {
        return NextResponse.json(
          {
            error: 'Avatar URL must be a valid URL',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
    }

    // Validate bio: optional, max 500 characters
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string') {
        return NextResponse.json(
          {
            error: 'Bio must be a string',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      if (bio.length > 500) {
        return NextResponse.json(
          {
            error: 'Bio must not exceed 500 characters',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: {
      displayName?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) {
      updates.displayName = displayName;
    }
    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl;
    }
    if (bio !== undefined) {
      updates.bio = bio;
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        role: users.role,
        isBanned: users.isBanned,
        tracksRatedCount: users.tracksRatedCount,
        tracksAddedCount: users.tracksAddedCount,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // Return updated user WITHOUT passwordHash
    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}