import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const limitParam = searchParams.get('limit') ?? '10';
    const sortBy = searchParams.get('sortBy') ?? 'tracksRatedCount';
    const order = searchParams.get('order') ?? 'desc';
    
    // Validate limit parameter
    const limit = parseInt(limitParam);
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { 
          error: 'Limit must be an integer between 1 and 50',
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      );
    }
    
    // Validate sortBy parameter
    const validSortByFields = ['tracksRatedCount', 'tracksAddedCount', 'createdAt'];
    if (!validSortByFields.includes(sortBy)) {
      return NextResponse.json(
        { 
          error: 'sortBy must be one of: tracksRatedCount, tracksAddedCount, createdAt',
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      );
    }
    
    // Validate order parameter
    if (order !== 'asc' && order !== 'desc') {
      return NextResponse.json(
        { 
          error: 'order must be either asc or desc',
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      );
    }
    
    // Build query - exclude banned users and select specific fields
    let query = db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
      tracksRatedCount: users.tracksRatedCount,
      tracksAddedCount: users.tracksAddedCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.isBanned, false));
    
    // Apply sorting
    const orderFn = order === 'asc' ? asc : desc;
    
    if (sortBy === 'tracksRatedCount') {
      query = query.orderBy(orderFn(users.tracksRatedCount));
    } else if (sortBy === 'tracksAddedCount') {
      query = query.orderBy(orderFn(users.tracksAddedCount));
    } else if (sortBy === 'createdAt') {
      query = query.orderBy(orderFn(users.createdAt));
    }
    
    // Apply limit
    const results = await query.limit(limit);
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}