import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { authUser } = body;

    // Authorization check
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Super admin access required',
          code: 'UNAUTHORIZED' 
        },
        { status: 403 }
      );
    }

    // Validate user ID from route params
    const userId = parseInt(params.id);
    if (!params.id || isNaN(userId)) {
      return NextResponse.json(
        { 
          error: 'Valid user ID is required',
          code: 'INVALID_ID' 
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

    // Check if user is already verified
    if (existingUser[0].isVerified) {
      return NextResponse.json(
        { 
          error: 'User is already verified',
          code: 'ALREADY_VERIFIED' 
        },
        { status: 400 }
      );
    }

    // Update user verification status
    const updatedUser = await db.update(users)
      .set({
        isVerified: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning();

    // Exclude passwordHash from response
    const { passwordHash, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json({
      message: 'User verified successfully',
      user: userWithoutPassword
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/users/[id]/verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { authUser } = body;

    // Authorization check
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Super admin access required',
          code: 'UNAUTHORIZED' 
        },
        { status: 403 }
      );
    }

    // Validate user ID from route params
    const userId = parseInt(params.id);
    if (!params.id || isNaN(userId)) {
      return NextResponse.json(
        { 
          error: 'Valid user ID is required',
          code: 'INVALID_ID' 
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

    // Check if user is currently verified
    if (!existingUser[0].isVerified) {
      return NextResponse.json(
        { 
          error: 'User is not verified',
          code: 'NOT_VERIFIED' 
        },
        { status: 400 }
      );
    }

    // Update user verification status
    const updatedUser = await db.update(users)
      .set({
        isVerified: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning();

    // Exclude passwordHash from response
    const { passwordHash, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json({
      message: 'User verification removed successfully',
      user: userWithoutPassword
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE /api/users/[id]/verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}