import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role, authUser } = body;

    // Check if authUser is provided and is super_admin
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Only super admins can update user roles',
          code: 'UNAUTHORIZED' 
        },
        { status: 403 }
      );
    }

    // Validate role is provided
    if (!role) {
      return NextResponse.json(
        { 
          error: 'Role is required',
          code: 'MISSING_ROLE' 
        },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ['super_admin', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          error: 'Role must be one of: super_admin, admin, moderator',
          code: 'INVALID_ROLE' 
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
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

    // Update user role
    const updated = await db.update(users)
      .set({
        role,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = updated[0];

    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}