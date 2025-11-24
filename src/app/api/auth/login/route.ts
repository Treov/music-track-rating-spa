import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    // Validate non-empty strings
    if (typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    // Find user by username with permissions
    const userResults = await db
      .select({
        id: users.id,
        username: users.username,
        password_hash: users.password_hash,
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
      .where(eq(users.username, username.trim()))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    const user = userResults[0];

    // Verify password - use snake_case field name
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { 
          error: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Check if user is banned - use snake_case field name
    if (user.is_banned) {
      return NextResponse.json(
        { 
          error: 'Your account has been banned',
          code: 'ACCOUNT_BANNED'
        },
        { status: 403 }
      );
    }

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

    return NextResponse.json(
      {
        message: 'Login successful',
        user: userResponse
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}