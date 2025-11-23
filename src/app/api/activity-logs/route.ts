import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLogs, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Authorization check
    const authUser = searchParams.get('authUser') || request.headers.get('authUser');
    if (!authUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    // Parse authUser and check for super_admin role
    let parsedAuthUser;
    try {
      parsedAuthUser = typeof authUser === 'string' ? JSON.parse(authUser) : authUser;
    } catch {
      return NextResponse.json({ 
        error: 'Invalid authentication data',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    if (parsedAuthUser.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Super admin access required',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Filters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query conditions
    const conditions = [];

    if (userId) {
      const parsedUserId = parseInt(userId);
      if (!isNaN(parsedUserId)) {
        conditions.push(eq(activityLogs.userId, parsedUserId));
      }
    }

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    if (startDate) {
      conditions.push(gte(activityLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(activityLogs.createdAt, endDate));
    }

    // Build query with join
    let query = db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        targetType: activityLogs.targetType,
        targetId: activityLogs.targetId,
        details: activityLogs.details,
        ipAddress: activityLogs.ipAddress,
        createdAt: activityLogs.createdAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query;

    return NextResponse.json(logs, { status: 200 });
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
    const { userId, action, targetType, targetId, details, ipAddress } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        error: 'Action is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    // Validate userId is a valid integer
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    // Validate action is non-empty string
    if (typeof action !== 'string' || action.trim() === '') {
      return NextResponse.json({ 
        error: 'Action must be a non-empty string',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    // Check if user exists
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, parsedUserId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Extract IP address from request headers if not provided
    let finalIpAddress = ipAddress;
    if (!finalIpAddress) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      finalIpAddress = forwardedFor?.split(',')[0].trim() || realIp || null;
    }

    // Process details - stringify if object
    let finalDetails = details;
    if (details && typeof details === 'object') {
      finalDetails = JSON.stringify(details);
    }

    // Create activity log
    const newLog = await db
      .insert(activityLogs)
      .values({
        userId: parsedUserId,
        action: action.trim(),
        targetType: targetType || null,
        targetId: targetId ? parseInt(targetId) : null,
        details: finalDetails || null,
        ipAddress: finalIpAddress,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}