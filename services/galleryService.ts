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
  
// In-memory stores that reset on page load
let inMemoryArtworks: Artwork[] = [];
const inMemoryComments: { [artworkId: string]: Comment[] } = {};

// --- Artworks ---

export function getArtworks(): Artwork[] {
    return inMemoryArtworks;
}
  
function saveArtworks(artworks: Artwork[]): void {
    inMemoryArtworks = artworks;
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
    delete inMemoryComments[id];
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
    return inMemoryComments[artworkId] || [];
}
  
function saveComments(artworkId: string, comments: Comment[]): void {
    inMemoryComments[artworkId] = comments;
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
