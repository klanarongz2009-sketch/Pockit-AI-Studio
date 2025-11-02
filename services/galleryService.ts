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

const ARTWORKS_KEY = 'gallery-artworks-v1';
const COMMENTS_KEY = 'gallery-comments-v1';


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
  
function saveArtworks(newArtworks: Artwork[]): void {
    try {
        localStorage.setItem(ARTWORKS_KEY, JSON.stringify(newArtworks));
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
    const newArtworks = [newArtwork, ...artworks]; // Add to the beginning
    saveArtworks(newArtworks);
    return newArtwork;
}
  
export function deleteArtwork(id: string): Artwork[] {
    let artworks = getArtworks();
    artworks = artworks.filter(art => art.id !== id);
    saveArtworks(artworks);
    // Also delete associated comments
    const allComments = get_all_comments_();
    delete allComments[id];
    save_all_comments_(allComments);
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

function get_all_comments_(): { [artworkId: string]: Comment[] } {
    try {
        const stored = localStorage.getItem(COMMENTS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Failed to load comments:", e);
        return {};
    }
}

function save_all_comments_(allComments: { [artworkId: string]: Comment[] }): void {
     try {
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    } catch (e) {
        console.error("Failed to save comments:", e);
    }
}

export function getComments(artworkId: string): Comment[] {
    const allComments = get_all_comments_();
    return allComments[artworkId] || [];
}
  
function saveComments(artworkId: string, comments: Comment[]): void {
    const allComments = get_all_comments_();
    allComments[artworkId] = comments;
    save_all_comments_(allComments);
}
  
export function addComment(artworkId: string, text: string): Comment[] {
    const comments = getComments(artworkId);
    const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        timestamp: Date.now(),
    };
    const newComments = [...comments, newComment];
    saveComments(artworkId, newComments);
    return newComments;
}

export function deleteComment(artworkId: string, commentId: string): Comment[] {
    let comments = getComments(artworkId);
    comments = comments.filter(c => c.id !== commentId);
    saveComments(artworkId, comments);
    return comments;
}
