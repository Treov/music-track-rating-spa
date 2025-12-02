import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { guestUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { displayName, authUser } = body;

    // Validate authUser is provided
    if (!authUser || typeof authUser !== 'object' || !authUser.role) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Check authorization - must be super_admin, admin, or moderator
    const allowedRoles = ['super_admin', 'admin', 'moderator'];
    if (!allowedRoles.includes(authUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Validate displayName is provided
    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required', code: 'MISSING_DISPLAY_NAME' },
        { status: 400 }
      );
    }

    // Validate displayName is a non-empty string with at least 2 characters
    const trimmedDisplayName = displayName.trim();
    if (typeof displayName !== 'string' || trimmedDisplayName.length < 2) {
      return NextResponse.json(
        { error: 'Display name must be at least 2 characters', code: 'INVALID_DISPLAY_NAME' },
        { status: 400 }
      );
    }

    // Check if guest user exists
    const existingUser = await db
      .select()
      .from(guestUsers)
      .where(eq(guestUsers.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Guest user not found', code: 'GUEST_USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update guest user
    const updated = await db
      .update(guestUsers)
      .set({
        displayName: trimmedDisplayName,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(guestUsers.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}