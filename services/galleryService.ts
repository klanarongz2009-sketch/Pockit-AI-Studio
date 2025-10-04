export interface Artwork {
    id: string; // Could be a timestamp + random string
    imageDataUrl: string; // The base64 data URL
    prompt: string;
    timestamp: number;
    isFavorite: boolean;
}
  
export interface Comment {
    id: string;
    text: string;
    timestamp: number;
}
  
const ARTWORKS_KEY = 'gallery-artworks';
const COMMENTS_KEY_PREFIX = 'gallery-comments-';

// --- Artworks ---

export function getArtworks(): Artwork[] {
    try {
        const stored = localStorage.getItem(ARTWORKS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load artworks:", e);
        return [];
    }
}
  
function saveArtworks(artworks: Artwork[]): void {
    try {
        localStorage.setItem(ARTWORKS_KEY, JSON.stringify(artworks));
    } catch (e) {
        console.error("Failed to save artworks:", e);
    }
}
  
export function addArtwork(imageDataUrl: string, prompt: string): Artwork {
    const artworks = getArtworks();
    const newArtwork: Artwork = {
        id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageDataUrl,
        prompt,
        timestamp: Date.now(),
        isFavorite: false,
    };
    artworks.unshift(newArtwork); // Add to the beginning
    saveArtworks(artworks);
    return newArtwork;
}
  
export function deleteArtwork(id: string): Artwork[] {
    let artworks = getArtworks();
    artworks = artworks.filter(art => art.id !== id);
    saveArtworks(artworks);
    // Also delete associated comments
    try {
        localStorage.removeItem(`${COMMENTS_KEY_PREFIX}${id}`);
    } catch (e) {
        console.error("Failed to delete comments for artwork " + id, e);
    }
    return artworks;
}
  
export function toggleFavorite(id: string): Artwork[] {
    const artworks = getArtworks();
    const artwork = artworks.find(art => art.id === id);
    if (artwork) {
        artwork.isFavorite = !artwork.isFavorite;
        saveArtworks(artworks);
    }
    return artworks;
}
  

// --- Comments ---

export function getComments(artworkId: string): Comment[] {
    try {
        const stored = localStorage.getItem(`${COMMENTS_KEY_PREFIX}${artworkId}`);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load comments for artwork " + artworkId, e);
        return [];
    }
}
  
function saveComments(artworkId: string, comments: Comment[]): void {
    try {
        localStorage.setItem(`${COMMENTS_KEY_PREFIX}${artworkId}`, JSON.stringify(comments));
    } catch (e) {
        console.error("Failed to save comments for artwork " + artworkId, e);
    }
}
  
export function addComment(artworkId: string, text: string): Comment[] {
    const comments = getComments(artworkId);
    const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        timestamp: Date.now(),
    };
    comments.push(newComment);
    saveComments(artworkId, comments);
    return comments;
}

export function deleteComment(artworkId: string, commentId: string): Comment[] {
    let comments = getComments(artworkId);
    comments = comments.filter(c => c.id !== commentId);
    saveComments(artworkId, comments);
    return comments;
}