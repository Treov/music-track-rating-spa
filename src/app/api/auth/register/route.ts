import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const VALID_ROLES = ['super_admin', 'admin', 'moderator'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, displayName, role, authUser } = body;

    // Check if authUser is provided
    if (!authUser || !authUser.id || !authUser.role) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'MISSING_AUTH_USER'
      }, { status: 400 });
    }

    // Authorization check: Only super_admin can create users
    if (authUser.role !== 'super_admin') {
      return NextResponse.json({
        error: 'Only super admins can create user accounts',
        code: 'UNAUTHORIZED'
      }, { status: 403 });
    }

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json({
        error: 'Username and password are required',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Validate username format and length
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        error: 'Username must be 3-50 characters, alphanumeric and underscores only',
        code: 'INVALID_USERNAME'
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      }, { status: 400 });
    }

    // Validate role if provided
    const userRole = role || 'admin';
    if (!VALID_ROLES.includes(userRole)) {
      return NextResponse.json({
        error: 'Role must be one of: super_admin, admin, moderator',
        code: 'INVALID_ROLE'
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({
        error: 'Username already exists',
        code: 'DUPLICATE_USERNAME'
      }, { status: 400 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user
    const timestamp = new Date().toISOString();
    const newUser = await db.insert(users)
      .values({
        username: username.trim(),
        passwordHash,
        displayName: displayName?.trim() || null,
        avatarUrl: null,
        bio: null,
        role: userRole,
        isBanned: false,
        tracksRatedCount: 0,
        tracksAddedCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    // Create default permissions for the new user
    await db.insert(userPermissions)
      .values({
        userId: newUser[0].id,
        canEditOthersRatings: false,
        canDeleteOthersRatings: false,
        canVerifyArtists: true,
        canAddArtists: true,
        canDeleteArtists: false,
        createdAt: timestamp,
        updatedAt: timestamp
      });

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}