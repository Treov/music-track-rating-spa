// Utility for managing guest user identification
// Uses browser fingerprinting to create a unique identifier

function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
  }
  
  const canvasData = canvas.toDataURL();
  
  // Combine multiple browser attributes for uniqueness
  const fingerprint = [
    canvasData,
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

export function getOrCreateFingerprint(): string {
  const stored = localStorage.getItem('guest_fingerprint');
  if (stored) return stored;
  
  const fingerprint = generateFingerprint();
  localStorage.setItem('guest_fingerprint', fingerprint);
  return fingerprint;
}

export function getGuestUserId(): number | null {
  const stored = localStorage.getItem('guest_user_id');
  return stored ? parseInt(stored) : null;
}

export function setGuestUserId(id: number): void {
  localStorage.setItem('guest_user_id', id.toString());
}

export function getGuestDisplayName(): string | null {
  return localStorage.getItem('guest_display_name');
}

export function setGuestDisplayName(name: string): void {
  localStorage.setItem('guest_display_name', name);
}

export async function ensureGuestUser(displayName?: string): Promise<{ id: number; displayName: string } | null> {
  const fingerprint = getOrCreateFingerprint();
  const existingId = getGuestUserId();
  const existingName = getGuestDisplayName();
  
  // If we already have a guest user ID and name, return it
  if (existingId && existingName) {
    return { id: existingId, displayName: existingName };
  }
  
  try {
    // Try to get or create guest user
    const response = await fetch('/api/guest-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fingerprint,
        displayName: displayName || existingName
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (error.code === 'DISPLAY_NAME_REQUIRED') {
        return null; // Need to ask for display name
      }
      throw new Error(error.error || 'Failed to create guest user');
    }
    
    const guestUser = await response.json();
    setGuestUserId(guestUser.id);
    setGuestDisplayName(guestUser.displayName);
    
    return { id: guestUser.id, displayName: guestUser.displayName };
  } catch (error) {
    console.error('Error ensuring guest user:', error);
    return null;
  }
}

export function clearGuestUser(): void {
  localStorage.removeItem('guest_user_id');
  localStorage.removeItem('guest_display_name');
  // Keep fingerprint for consistency
}
