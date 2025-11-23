import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Parse filter parameters
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const bannedParam = searchParams.get('banned');
    
    // Build the base query with LEFT JOIN
    let query = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        role: users.role,
        isBanned: users.isBanned,
        tracksRatedCount: users.tracksRatedCount,
        tracksAddedCount: users.tracksAddedCount,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        permissions: {
          id: userPermissions.id,
          userId: userPermissions.userId,
          canEditOthersRatings: userPermissions.canEditOthersRatings,
          canDeleteOthersRatings: userPermissions.canDeleteOthersRatings,
          canVerifyArtists: userPermissions.canVerifyArtists,
          canAddArtists: userPermissions.canAddArtists,
          canDeleteArtists: userPermissions.canDeleteArtists,
          createdAt: userPermissions.createdAt,
          updatedAt: userPermissions.updatedAt,
        }
      })
      .from(users)
      .leftJoin(userPermissions, eq(users.id, userPermissions.userId));

    // Build WHERE conditions
    const conditions = [];
    
    // Search condition
    if (search) {
      conditions.push(
        or(
          like(users.username, `%${search}%`),
          like(users.displayName, `%${search}%`)
        )
      );
    }
    
    // Role filter
    if (role && ['super_admin', 'admin', 'moderator'].includes(role)) {
      conditions.push(eq(users.role, role));
    }
    
    // Banned status filter
    if (bannedParam !== null) {
      const isBanned = bannedParam === 'true';
      conditions.push(eq(users.isBanned, isBanned));
    }
    
    // Apply WHERE conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply ordering, limit, and offset
    const results = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Transform results to handle null permissions and structure response
    const formattedResults = results.map(row => ({
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      role: row.role,
      isBanned: row.isBanned,
      tracksRatedCount: row.tracksRatedCount,
      tracksAddedCount: row.tracksAddedCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      permissions: row.permissions.id ? {
        id: row.permissions.id,
        userId: row.permissions.userId,
        canEditOthersRatings: row.permissions.canEditOthersRatings,
        canDeleteOthersRatings: row.permissions.canDeleteOthersRatings,
        canVerifyArtists: row.permissions.canVerifyArtists,
        canAddArtists: row.permissions.canAddArtists,
        canDeleteArtists: row.permissions.canDeleteArtists,
        createdAt: row.permissions.createdAt,
        updatedAt: row.permissions.updatedAt,
      } : null
    }));
    
    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}