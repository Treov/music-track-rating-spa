import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userAwards, awards } from '@/db/schema';
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
    
    // Build WHERE conditions for users
    const conditions = [];
    
    // Search condition
    if (search) {
      conditions.push(
        or(
          like(users.username, `%${search}%`),
          like(users.display_name, `%${search}%`)
        )
      );
    }
    
    // Role filter
    if (role && ['super_admin', 'admin', 'moderator', 'evaluator'].includes(role)) {
      conditions.push(eq(users.role, role));
    }
    
    // Banned status filter
    if (bannedParam !== null) {
      const isBanned = bannedParam === 'true';
      conditions.push(eq(users.is_banned, isBanned));
    }
    
    // Fetch users
    let usersQuery = db.select().from(users);
    
    if (conditions.length > 0) {
      usersQuery = usersQuery.where(and(...conditions));
    }
    
    const usersResult = await usersQuery
      .orderBy(desc(users.id))
      .limit(limit)
      .offset(offset);
    
    // Fetch awards
    const awardsByUser: Record<number, any[]> = {};
    try {
      const allUserAwards = await db
        .select({
          userId: userAwards.userId,
          awardId: userAwards.awardId,
          assignedAt: userAwards.assignedAt,
          name: awards.name,
          description: awards.description,
          iconUrl: awards.iconUrl,
          color: awards.color,
        })
        .from(userAwards)
        .innerJoin(awards, eq(userAwards.awardId, awards.id));
      
      for (const award of allUserAwards) {
        if (!awardsByUser[award.userId]) {
          awardsByUser[award.userId] = [];
        }
        awardsByUser[award.userId].push({
          id: award.awardId,
          awardId: award.awardId,
          name: award.name,
          description: award.description,
          iconUrl: award.iconUrl,
          color: award.color,
          assignedAt: award.assignedAt,
        });
      }
    } catch (awardsError) {
      console.error('Error fetching awards:', awardsError);
    }
    
    // Combine results
    const formattedResults = usersResult.map(user => ({
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
      updatedAt: user.updated_at,
      awards: awardsByUser[user.id] || [],
      permissions: null
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