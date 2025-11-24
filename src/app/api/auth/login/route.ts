import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
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

    // Find user by username
    const userResults = await db.select()
      .from(users)
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
      updatedAt: user.updated_at
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