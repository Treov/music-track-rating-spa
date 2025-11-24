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
        display_name: users.display_name,
        avatar_url: users.avatar_url,
        bio: users.bio,
        role: users.role,
        is_verified: users.is_verified,
        is_banned: users.is_banned,
        tracks_rated_count: users.tracks_rated_count,
        tracks_added_count: users.tracks_added_count,
        created_at: users.created_at,
        updated_at: users.updated_at,
        permissions: {
          id: userPermissions.id,
          user_id: userPermissions.user_id,
          can_edit_others_ratings: userPermissions.can_edit_others_ratings,
          can_delete_others_ratings: userPermissions.can_delete_others_ratings,
          can_verify_artists: userPermissions.can_verify_artists,
          can_add_artists: userPermissions.can_add_artists,
          can_delete_artists: userPermissions.can_delete_artists,
          created_at: userPermissions.created_at,
          updated_at: userPermissions.updated_at,
        },
      })
      .from(users)
      .leftJoin(userPermissions, eq(users.id, userPermissions.user_id))
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

    // Map snake_case to camelCase for response
    const userResponse = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      role: user.role,
      isVerified: user.is_verified,
      isBanned: user.is_banned,
      tracksRatedCount: user.tracks_rated_count,
      tracksAddedCount: user.tracks_added_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      permissions: user.permissions && user.permissions.id ? {
        id: user.permissions.id,
        userId: user.permissions.user_id,
        canEditOthersRatings: user.permissions.can_edit_others_ratings,
        canDeleteOthersRatings: user.permissions.can_delete_others_ratings,
        canVerifyArtists: user.permissions.can_verify_artists,
        canAddArtists: user.permissions.can_add_artists,
        canDeleteArtists: user.permissions.can_delete_artists,
        createdAt: user.permissions.created_at,
        updatedAt: user.permissions.updated_at,
      } : null
    };

    return NextResponse.json(userResponse, { status: 200 });
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
    const { username, displayName, avatarUrl, bio } = body;

    // Validate username if provided
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return NextResponse.json(
          {
            error: 'Username must be a string',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      
      const trimmedUsername = username.trim();
      
      if (trimmedUsername.length < 3) {
        return NextResponse.json(
          {
            error: 'Username must be at least 3 characters',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      
      if (trimmedUsername.length > 50) {
        return NextResponse.json(
          {
            error: 'Username must not exceed 50 characters',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      
      // Check if username is already taken by another user
      if (trimmedUsername !== existingUser[0].username) {
        const duplicateCheck = await db
          .select()
          .from(users)
          .where(eq(users.username, trimmedUsername))
          .limit(1);
          
        if (duplicateCheck.length > 0 && duplicateCheck[0].id !== userId) {
          return NextResponse.json(
            {
              error: 'Username already taken',
              code: 'USERNAME_TAKEN',
            },
            { status: 400 }
          );
        }
      }
    }

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

    // Build update object with only provided fields - use snake_case
    const updates: {
      username?: string;
      display_name?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) {
      updates.username = username.trim();
    }
    if (displayName !== undefined) {
      updates.display_name = displayName;
    }
    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }
    if (bio !== undefined) {
      updates.bio = bio;
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    // Map snake_case to camelCase for response
    const userResponse = {
      id: updatedUser[0].id,
      username: updatedUser[0].username,
      displayName: updatedUser[0].display_name,
      avatarUrl: updatedUser[0].avatar_url,
      bio: updatedUser[0].bio,
      role: updatedUser[0].role,
      isVerified: updatedUser[0].is_verified,
      isBanned: updatedUser[0].is_banned,
      tracksRatedCount: updatedUser[0].tracks_rated_count,
      tracksAddedCount: updatedUser[0].tracks_added_count,
      createdAt: updatedUser[0].created_at,
      updatedAt: updatedUser[0].updated_at,
    };

    return NextResponse.json(userResponse, { status: 200 });
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