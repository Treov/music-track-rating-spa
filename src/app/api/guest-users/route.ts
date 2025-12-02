import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { guestUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, displayName } = body;

    // Validate fingerprint
    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Fingerprint is required',
          code: 'MISSING_FINGERPRINT' 
        },
        { status: 400 }
      );
    }

    const trimmedFingerprint = fingerprint.trim();

    // Check if guest user already exists with this fingerprint
    const existingUser = await db.select()
      .from(guestUsers)
      .where(eq(guestUsers.fingerprint, trimmedFingerprint))
      .limit(1);

    // If user exists, return existing user
    if (existingUser.length > 0) {
      return NextResponse.json(existingUser[0], { status: 200 });
    }

    // For new users, validate displayName is provided
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { 
          error: 'Display name is required for new guest users',
          code: 'MISSING_DISPLAY_NAME' 
        },
        { status: 400 }
      );
    }

    const trimmedDisplayName = displayName.trim();

    // Validate displayName length
    if (trimmedDisplayName.length < 2) {
      return NextResponse.json(
        { 
          error: 'Display name must be at least 2 characters',
          code: 'INVALID_DISPLAY_NAME' 
        },
        { status: 400 }
      );
    }

    // Create new guest user
    const newGuestUser = await db.insert(guestUsers)
      .values({
        displayName: trimmedDisplayName,
        fingerprint: trimmedFingerprint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newGuestUser[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
}