import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);

    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const artistTracks = await db.select()
      .from(tracks)
      .where(eq(tracks.artistId, artistId));

    return NextResponse.json({
      ...artist[0],
      tracks: artistTracks
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);

    const existingArtist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (existingArtist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, imageUrl } = body;

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ 
          error: "Name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }

      const trimmedName = name.trim();

      const duplicateArtist = await db.select()
        .from(artists)
        .where(and(
          eq(artists.name, trimmedName),
          ne(artists.id, artistId)
        ))
        .limit(1);

      if (duplicateArtist.length > 0) {
        return NextResponse.json({ 
          error: "An artist with this name already exists",
          code: "DUPLICATE_NAME" 
        }, { status: 400 });
      }

      updates.name = trimmedName;
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl;
    }

    const updated = await db.update(artists)
      .set(updates)
      .where(eq(artists.id, artistId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);

    const existingArtist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (existingArtist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const artistTracks = await db.select()
      .from(tracks)
      .where(eq(tracks.artistId, artistId))
      .limit(1);

    if (artistTracks.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete artist with existing tracks",
        code: "ARTIST_HAS_TRACKS" 
      }, { status: 400 });
    }

    const deleted = await db.delete(artists)
      .where(eq(artists.id, artistId))
      .returning();

    return NextResponse.json({
      message: 'Artist deleted successfully',
      id: deleted[0].id
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}