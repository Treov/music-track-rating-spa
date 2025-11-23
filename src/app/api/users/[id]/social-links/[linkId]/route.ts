import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { socialLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const { id, linkId } = params;
    
    // Parse request body safely
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const { platform, url, authUser } = body;

    // Validate authUser
    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Validate IDs
    const userId = parseInt(id);
    const socialLinkId = parseInt(linkId);

    if (isNaN(userId) || isNaN(socialLinkId)) {
      return NextResponse.json(
        { error: 'Valid user ID and link ID are required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check authorization
    const isAuthorized = authUser.id === userId || authUser.role === 'super_admin';
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to update this social link', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Check if social link exists and belongs to the user
    const existingLink = await db
      .select()
      .from(socialLinks)
      .where(and(eq(socialLinks.id, socialLinkId), eq(socialLinks.userId, userId)))
      .limit(1);

    if (existingLink.length === 0) {
      return NextResponse.json(
        { error: 'Social link not found', code: 'LINK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate platform if provided
    if (platform !== undefined) {
      if (!VALID_PLATFORMS.includes(platform)) {
        return NextResponse.json(
          {
            error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
            code: 'INVALID_PLATFORM'
          },
          { status: 400 }
        );
      }

      // Check for duplicate platform if platform is being changed
      if (platform !== existingLink[0].platform) {
        const duplicateCheck = await db
          .select()
          .from(socialLinks)
          .where(
            and(
              eq(socialLinks.userId, userId),
              eq(socialLinks.platform, platform)
            )
          )
          .limit(1);

        if (duplicateCheck.length > 0) {
          return NextResponse.json(
            {
              error: 'A social link with this platform already exists',
              code: 'DUPLICATE_PLATFORM'
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate url if provided
    if (url !== undefined) {
      if (typeof url !== 'string' || url.trim().length === 0) {
        return NextResponse.json(
          { error: 'URL must be a non-empty string', code: 'INVALID_URL' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (platform !== undefined) {
      updateData.platform = platform;
    }

    if (url !== undefined) {
      updateData.url = url.trim();
    }

    // Update the social link
    const updated = await db
      .update(socialLinks)
      .set(updateData)
      .where(and(eq(socialLinks.id, socialLinkId), eq(socialLinks.userId, userId)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const { id, linkId } = params;
    
    // Parse request body safely
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const { authUser } = body;

    // Validate authUser
    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Validate IDs
    const userId = parseInt(id);
    const socialLinkId = parseInt(linkId);

    if (isNaN(userId) || isNaN(socialLinkId)) {
      return NextResponse.json(
        { error: 'Valid user ID and link ID are required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check authorization
    const isAuthorized = authUser.id === userId || authUser.role === 'super_admin';
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this social link', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Check if social link exists and belongs to the user
    const existingLink = await db
      .select()
      .from(socialLinks)
      .where(and(eq(socialLinks.id, socialLinkId), eq(socialLinks.userId, userId)))
      .limit(1);

    if (existingLink.length === 0) {
      return NextResponse.json(
        { error: 'Social link not found', code: 'LINK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the social link
    const deleted = await db
      .delete(socialLinks)
      .where(and(eq(socialLinks.id, socialLinkId), eq(socialLinks.userId, userId)))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Social link deleted successfully',
        deletedLinkId: deleted[0].id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}