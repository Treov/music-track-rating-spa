import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks, artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const result = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artistId: tracks.artistId,
        albumArt: tracks.albumArt,
        vocals: tracks.vocals,
        production: tracks.production,
        lyrics: tracks.lyrics,
        originality: tracks.originality,
        vibe: tracks.vibe,
        notes: tracks.notes,
        createdAt: tracks.createdAt,
        updatedAt: tracks.updatedAt,
        artistName: artists.name,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(eq(tracks.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    const body = await request.json();
    const { title, artistId, albumArt, vocals, production, lyrics, originality, vibe, notes } = body;

    const existingTrack = await db.select()
      .from(tracks)
      .where(eq(tracks.id, parseInt(id)))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    const updates: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: "Title must be a non-empty string",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (artistId !== undefined) {
      if (typeof artistId !== 'number' || isNaN(artistId)) {
        return NextResponse.json({ 
          error: "Artist ID must be a valid integer",
          code: "INVALID_ARTIST_ID" 
        }, { status: 400 });
      }

      const artistExists = await db.select()
        .from(artists)
        .where(eq(artists.id, artistId))
        .limit(1);

      if (artistExists.length === 0) {
        return NextResponse.json({ 
          error: "Artist not found",
          code: "ARTIST_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.artistId = artistId;
    }

    if (albumArt !== undefined) {
      updates.albumArt = albumArt;
    }

    const ratingFields = [
      { name: 'vocals', value: vocals },
      { name: 'production', value: production },
      { name: 'lyrics', value: lyrics },
      { name: 'originality', value: originality },
      { name: 'vibe', value: vibe }
    ];

    for (const field of ratingFields) {
      if (field.value !== undefined) {
        if (typeof field.value !== 'number' || isNaN(field.value) || !Number.isInteger(field.value)) {
          return NextResponse.json({ 
            error: `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} must be an integer`,
            code: `INVALID_${field.name.toUpperCase()}` 
          }, { status: 400 });
        }

        if (field.value < 0 || field.value > 10) {
          return NextResponse.json({ 
            error: `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} must be between 0 and 10`,
            code: `INVALID_${field.name.toUpperCase()}_RANGE` 
          }, { status: 400 });
        }

        updates[field.name] = field.value;
      }
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db.update(tracks)
      .set(updates)
      .where(eq(tracks.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    const existingTrack = await db.select()
      .from(tracks)
      .where(eq(tracks.id, parseInt(id)))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    await db.delete(tracks)
      .where(eq(tracks.id, parseInt(id)));

    return NextResponse.json({ 
      message: 'Track deleted successfully',
      id: parseInt(id)
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}