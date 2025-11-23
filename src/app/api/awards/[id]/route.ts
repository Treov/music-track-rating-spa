import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { awards, userAwards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const award = await db
      .select()
      .from(awards)
      .where(eq(awards.id, parseInt(id)))
      .limit(1);

    if (award.length === 0) {
      return NextResponse.json(
        {
          error: 'Award not found',
          code: 'AWARD_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(award[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message
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
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

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

    const { authUser, name, description, iconUrl, color } = body;

    // Authorization check
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Check if award exists
    const existingAward = await db
      .select()
      .from(awards)
      .where(eq(awards.id, parseInt(id)))
      .limit(1);

    if (existingAward.length === 0) {
      return NextResponse.json(
        {
          error: 'Award not found',
          code: 'AWARD_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          {
            error: 'Name must be at least 2 characters long',
            code: 'INVALID_NAME'
          },
          { status: 400 }
        );
      }
    }

    // Validate color if provided
    if (color !== undefined) {
      const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
      if (typeof color !== 'string' || !hexColorRegex.test(color)) {
        return NextResponse.json(
          {
            error: 'Color must be in hex format (#RRGGBB or #RGB)',
            code: 'INVALID_COLOR'
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string;
      iconUrl?: string;
      color?: string;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (iconUrl !== undefined) {
      updateData.iconUrl = iconUrl;
    }
    if (color !== undefined) {
      updateData.color = color;
    }

    const updated = await db
      .update(awards)
      .set(updateData)
      .where(eq(awards.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        {
          error: 'Award not found',
          code: 'AWARD_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

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
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Check if award exists
    const existingAward = await db
      .select()
      .from(awards)
      .where(eq(awards.id, parseInt(id)))
      .limit(1);

    if (existingAward.length === 0) {
      return NextResponse.json(
        {
          error: 'Award not found',
          code: 'AWARD_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if award is assigned to any users
    const assignments = await db
      .select()
      .from(userAwards)
      .where(eq(userAwards.awardId, parseInt(id)))
      .limit(1);

    if (assignments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete award that is assigned to users',
          code: 'AWARD_HAS_ASSIGNMENTS'
        },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(awards)
      .where(eq(awards.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          error: 'Award not found',
          code: 'AWARD_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Award deleted successfully',
        id: deleted[0].id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}