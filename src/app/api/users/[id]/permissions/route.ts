import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const {
      authUser,
      canEditOthersRatings,
      canDeleteOthersRatings,
      canVerifyArtists,
      canAddArtists,
      canDeleteArtists,
    } = body;

    // Verify authUser is provided
    if (!authUser || !authUser.id || !authUser.role) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Verify authUser is super_admin
    if (authUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can update permissions', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Check if at least one permission field is provided
    const hasUpdates =
      canEditOthersRatings !== undefined ||
      canDeleteOthersRatings !== undefined ||
      canVerifyArtists !== undefined ||
      canAddArtists !== undefined ||
      canDeleteArtists !== undefined;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'At least one permission field required', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Validate permission fields are boolean if provided
    const permissionFields = [
      { name: 'canEditOthersRatings', value: canEditOthersRatings },
      { name: 'canDeleteOthersRatings', value: canDeleteOthersRatings },
      { name: 'canVerifyArtists', value: canVerifyArtists },
      { name: 'canAddArtists', value: canAddArtists },
      { name: 'canDeleteArtists', value: canDeleteArtists },
    ];

    for (const field of permissionFields) {
      if (field.value !== undefined && typeof field.value !== 'boolean') {
        return NextResponse.json(
          { error: 'Permission values must be boolean', code: 'INVALID_PERMISSION' },
          { status: 400 }
        );
      }
    }

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if permissions record exists
    const existingPermissions = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId))
      .limit(1);

    const timestamp = new Date().toISOString();

    if (existingPermissions.length > 0) {
      // Update existing permissions
      const updates: any = {
        updatedAt: timestamp,
      };

      if (canEditOthersRatings !== undefined) {
        updates.canEditOthersRatings = canEditOthersRatings;
      }
      if (canDeleteOthersRatings !== undefined) {
        updates.canDeleteOthersRatings = canDeleteOthersRatings;
      }
      if (canVerifyArtists !== undefined) {
        updates.canVerifyArtists = canVerifyArtists;
      }
      if (canAddArtists !== undefined) {
        updates.canAddArtists = canAddArtists;
      }
      if (canDeleteArtists !== undefined) {
        updates.canDeleteArtists = canDeleteArtists;
      }

      const updated = await db
        .update(userPermissions)
        .set(updates)
        .where(eq(userPermissions.userId, userId))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new permissions record with provided values and defaults
      const newPermissions = await db
        .insert(userPermissions)
        .values({
          userId: userId,
          canEditOthersRatings: canEditOthersRatings ?? false,
          canDeleteOthersRatings: canDeleteOthersRatings ?? false,
          canVerifyArtists: canVerifyArtists ?? true,
          canAddArtists: canAddArtists ?? true,
          canDeleteArtists: canDeleteArtists ?? false,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning();

      return NextResponse.json(newPermissions[0], { status: 200 });
    }
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}