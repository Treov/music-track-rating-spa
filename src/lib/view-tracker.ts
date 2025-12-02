// Utility for tracking views of artists and tracks
import { getOrCreateGuestUser } from './guest-user';

export async function trackArtistView(artistId: number, userId: number | null = null): Promise<void> {
  try {
    const guestUser = await getOrCreateGuestUser();
    
    await fetch(`/api/artists/${artistId}/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fingerprint: guestUser.fingerprint,
        userId: userId,
        guestId: guestUser.id || null
      }),
    });
  } catch (error) {
    console.error('Error tracking artist view:', error);
  }
}

export async function trackTrackView(trackId: number, userId: number | null = null): Promise<void> {
  try {
    const guestUser = await getOrCreateGuestUser();
    
    await fetch(`/api/tracks/${trackId}/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fingerprint: guestUser.fingerprint,
        userId: userId,
        guestId: guestUser.id || null
      }),
    });
  } catch (error) {
    console.error('Error tracking track view:', error);
  }
}

export async function getArtistViewCount(artistId: number): Promise<number> {
  try {
    const response = await fetch(`/api/artists/${artistId}/views`);
    if (response.ok) {
      const data = await response.json();
      return data.uniqueViews;
    }
  } catch (error) {
    console.error('Error fetching artist views:', error);
  }
  return 0;
}

export async function getTrackViewCount(trackId: number): Promise<number> {
  try {
    const response = await fetch(`/api/tracks/${trackId}/views`);
    if (response.ok) {
      const data = await response.json();
      return data.uniqueViews;
    }
  } catch (error) {
    console.error('Error fetching track views:', error);
  }
  return 0;
}