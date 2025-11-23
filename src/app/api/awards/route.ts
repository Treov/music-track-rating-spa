import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { awards } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db.select()
      .from(awards)
      .orderBy(desc(awards.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, iconUrl, color, authUser } = body;

    // Authorization check
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Unauthorized: super_admin role required',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json({ 
        error: 'Name must be at least 2 characters long',
        code: 'INVALID_NAME' 
      }, { status: 400 });
    }

    // Validate color format if provided
    if (color) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(color)) {
        return NextResponse.json({ 
          error: 'Color must be a valid hex color format (#RRGGBB or #RGB)',
          code: 'INVALID_COLOR' 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: {
      name: string;
      description?: string;
      iconUrl?: string;
      color?: string;
      createdAt: string;
      updatedAt: string;
    } = {
      name: trimmedName,
      createdAt: now,
      updatedAt: now,
    };

    if (description) {
      insertData.description = description.trim();
    }

    if (iconUrl) {
      insertData.iconUrl = iconUrl.trim();
    }

    if (color) {
      insertData.color = color.trim();
    }

    // Insert the award
    const newAward = await db.insert(awards)
      .values(insertData)
      .returning();

    return NextResponse.json(newAward[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}