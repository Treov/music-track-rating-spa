import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { banned, authUser } = body;

    // Verify authUser is super_admin
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Only super admins can ban/unban users',
          code: 'UNAUTHORIZED' 
        },
        { status: 403 }
      );
    }

    // Validate banned field is present
    if (banned === undefined || banned === null) {
      return NextResponse.json(
        { 
          error: 'Banned field is required',
          code: 'MISSING_BANNED' 
        },
        { status: 400 }
      );
    }

    // Validate banned is boolean
    if (typeof banned !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Banned must be a boolean value',
          code: 'INVALID_BANNED' 
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Update user isBanned field
    const updated = await db.update(users)
      .set({
        isBanned: banned,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning();

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = updated[0];

    const message = banned ? 'User banned successfully' : 'User unbanned successfully';

    return NextResponse.json(
      {
        ...userWithoutPassword,
        message
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}