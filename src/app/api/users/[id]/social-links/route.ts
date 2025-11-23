import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { socialLinks, users } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

const VALID_PLATFORMS = [
  'vk',
  'instagram',
  'soundcloud',
  'youtube',
  'telegram',
  'discord',
  'yandex_music',
  'genius',
  'website'
] as const;

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const links = await db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.userId, userIdInt))
      .orderBy(asc(socialLinks.createdAt));

    return NextResponse.json(links, { status: 200 });
  } catch (error) {
    console.error('GET social links error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);

    const body = await request.json();
    const { platform, url, authUser } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        {
          error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
          code: 'INVALID_PLATFORM'
        },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json(
        { error: 'Valid URL is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url.trim())) {
      return NextResponse.json(
        { error: 'Invalid URL format', code: 'INVALID_URL' },
        { status: 400 }
      );
    }

    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const isAuthorized =
      authUser.id === userIdInt || authUser.role === 'super_admin';

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: 'Not authorized to modify this user',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingLink = await db
      .select()
      .from(socialLinks)
      .where(
        and(
          eq(socialLinks.userId, userIdInt),
          eq(socialLinks.platform, platform)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      return NextResponse.json(
        {
          error: 'User already has a link for this platform',
          code: 'DUPLICATE_PLATFORM'
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newLink = await db
      .insert(socialLinks)
      .values({
        userId: userIdInt,
        platform: platform.trim(),
        url: url.trim(),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newLink[0], { status: 201 });
  } catch (error) {
    console.error('POST social links error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}