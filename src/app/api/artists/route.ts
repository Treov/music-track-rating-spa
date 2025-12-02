import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks } from '@/db/schema';
import { eq, like, sql, desc } from 'drizzle-orm';

// Transliteration map for Russian/Cyrillic to Latin
const translitMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

function transliterate(text: string): string {
  return text.split('').map(char => translitMap[char] || char).join('');
}

function generateSlug(name: string): string {
  // First transliterate Russian to Latin
  const transliterated = transliterate(name);
  
  // Then create slug
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy'); // 'tracks' or 'rating'
    const minTracks = parseInt(searchParams.get('minTracks') ?? '0');
    const minRating = parseFloat(searchParams.get('minRating') ?? '0');
    const timePeriod = searchParams.get('timePeriod'); // 'day', 'week', 'month', 'all'

    // Calculate date filter based on time period
    let dateFilter = '';
    if (timePeriod && timePeriod !== 'all') {
      const now = new Date();
      let daysAgo = 0;
      
      switch (timePeriod) {
        case 'day':
          daysAgo = 1;
          break;
        case 'week':
          daysAgo = 7;
          break;
        case 'month':
          daysAgo = 30;
          break;
      }
      
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      dateFilter = cutoffDate.toISOString();
    }

    let query = db
      .select({
        id: artists.id,
        name: artists.name,
        slug: artists.slug,
        imageUrl: artists.imageUrl,
        verified: artists.verified,
        createdAt: artists.createdAt,
        updatedAt: artists.updatedAt,
        trackCount: sql<number>`cast(count(${tracks.id}) as integer)`,
        avgRating: sql<number>`ROUND(CAST(AVG((${tracks.vocals} + ${tracks.production} + ${tracks.lyrics} + ${tracks.quality} + ${tracks.vibe}) / 5.0) AS REAL), 2)`,
        totalRating: sql<number>`ROUND(CAST(SUM(${tracks.vocals} + ${tracks.production} + ${tracks.lyrics} + ${tracks.quality} + ${tracks.vibe}) / 5.0 AS REAL), 2)`,
      })
      .from(artists)
      .leftJoin(tracks, dateFilter 
        ? sql`${artists.id} = ${tracks.artistId} AND ${tracks.createdAt} >= ${dateFilter}`
        : eq(artists.id, tracks.artistId)
      )
      .groupBy(artists.id)
      .$dynamic();

    if (search) {
      query = query.where(like(artists.name, `%${search}%`));
    }

    // Apply sorting
    if (sortBy === 'tracks') {
      query = query.orderBy(desc(sql`cast(count(${tracks.id}) as integer)`));
    } else if (sortBy === 'rating') {
      query = query.orderBy(desc(sql`SUM(${tracks.vocals} + ${tracks.production} + ${tracks.lyrics} + ${tracks.quality} + ${tracks.vibe}) / 5.0`));
    } else {
      query = query.orderBy(desc(artists.createdAt));
    }

    const results = await query.limit(limit).offset(offset);

    // Apply filters after query (since HAVING is complex with drizzle)
    const filtered = results.filter(artist => {
      if (minTracks > 0 && artist.trackCount < minTracks) return false;
      if (minRating > 0 && (artist.totalRating === null || artist.totalRating < minRating)) return false;
      return true;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imageUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    const existingArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.name, trimmedName))
      .limit(1);

    if (existingArtist.length > 0) {
      return NextResponse.json(
        { error: 'Artist with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 400 }
      );
    }

    // Generate slug from name with transliteration support
    const slug = generateSlug(trimmedName);

    const now = new Date().toISOString();
    const insertData = {
      name: trimmedName,
      slug: slug,
      imageUrl: imageUrl || null,
      verified: 0,
      createdAt: now,
      updatedAt: now,
    };

    const newArtist = await db.insert(artists).values(insertData).returning();

    return NextResponse.json(newArtist[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}