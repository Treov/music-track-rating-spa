import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const idOrSlug = request.nextUrl.pathname.split('/').pop();
    
    if (!idOrSlug || idOrSlug.trim() === '') {
      return NextResponse.json({ 
        error: "Valid ID or slug is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Determine if it's numeric ID or slug
    const isNumeric = !isNaN(parseInt(idOrSlug)) && parseInt(idOrSlug).toString() === idOrSlug;
    
    let artist;
    if (isNumeric) {
      // Lookup by ID
      artist = await db.select()
        .from(artists)
        .where(eq(artists.id, parseInt(idOrSlug)))
        .limit(1);
    } else {
      // Lookup by slug
      artist = await db.select()
        .from(artists)
        .where(eq(artists.slug, idOrSlug))
        .limit(1);
    }

    if (artist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const artistTracks = await db.select()
      .from(tracks)
      .where(eq(tracks.artistId, artist[0].id));

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
    const idOrSlug = request.nextUrl.pathname.split('/').pop();
    
    if (!idOrSlug || idOrSlug.trim() === '') {
      return NextResponse.json({ 
        error: "Valid ID or slug is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Determine if it's numeric ID or slug
    const isNumeric = !isNaN(parseInt(idOrSlug)) && parseInt(idOrSlug).toString() === idOrSlug;
    
    let existingArtist;
    if (isNumeric) {
      existingArtist = await db.select()
        .from(artists)
        .where(eq(artists.id, parseInt(idOrSlug)))
        .limit(1);
    } else {
      existingArtist = await db.select()
        .from(artists)
        .where(eq(artists.slug, idOrSlug))
        .limit(1);
    }

    if (existingArtist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const artistId = existingArtist[0].id;

    const body = await request.json();
    const { name, imageUrl, verified } = body;

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
      
      // Generate slug from name
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      updates.slug = slug;
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl;
    }

    if (verified !== undefined) {
      if (typeof verified !== 'number' || (verified !== 0 && verified !== 1)) {
        return NextResponse.json({ 
          error: "Verified must be 0 or 1",
          code: "INVALID_VERIFIED" 
        }, { status: 400 });
      }
      updates.verified = verified;
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
    const idOrSlug = request.nextUrl.pathname.split('/').pop();
    
    if (!idOrSlug || idOrSlug.trim() === '') {
      return NextResponse.json({ 
        error: "Valid ID or slug is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Determine if it's numeric ID or slug
    const isNumeric = !isNaN(parseInt(idOrSlug)) && parseInt(idOrSlug).toString() === idOrSlug;
    
    let existingArtist;
    if (isNumeric) {
      existingArtist = await db.select()
        .from(artists)
        .where(eq(artists.id, parseInt(idOrSlug)))
        .limit(1);
    } else {
      existingArtist = await db.select()
        .from(artists)
        .where(eq(artists.slug, idOrSlug))
        .limit(1);
    }

    if (existingArtist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const artistId = existingArtist[0].id;

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