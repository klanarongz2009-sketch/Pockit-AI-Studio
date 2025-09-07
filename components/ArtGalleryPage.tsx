import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as galleryService from '../services/galleryService';
import * as audioService from '../services/audioService';
import { Modal } from './Modal';
import { HeartIcon } from './icons/HeartIcon';
import { HeartFilledIcon } from './icons/HeartFilledIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ShareIcon } from './icons/ShareIcon';
import { SendIcon } from './icons/SendIcon';
import { CopyIcon } from './icons/CopyIcon';

interface ArtGalleryPageProps {
    isOnline: boolean;
    playSound: (player: () => void) => void;
}

type Filter = 'all' | 'favorites';

const ArtworkItem: React.FC<{
    artwork: galleryService.Artwork;
    onSelect: () => void;
    onToggleFavorite: () => void;
    playSound: (player: () => void) => void;
}> = ({ artwork, onSelect, onToggleFavorite, playSound }) => (
    <div className="relative group aspect-square border-4 border-brand-light shadow-pixel bg-black/50 overflow-hidden">
        <img
            src={artwork.imageDataUrl}
            alt={artwork.prompt}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            style={{ imageRendering: 'pixelated' }}
            loading="lazy"
        />
        <div 
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={onSelect}
            onMouseEnter={() => playSound(audioService.playHover)}
        >
            <p className="text-white font-press-start text-xs text-center p-2 truncate">{artwork.prompt}</p>
        </div>
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
            }}
            aria-label={artwork.isFavorite ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
            className="absolute top-2 right-2 p-2 bg-black/50 border border-brand-light rounded-full text-brand-magenta transition-colors hover:bg-brand-magenta hover:text-white"
        >
            {artwork.isFavorite ? <HeartFilledIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
        </button>
    </div>
);


export const ArtGalleryPage: React.FC<ArtGalleryPageProps> = ({ playSound }) => {
    const [artworks, setArtworks] = useState<galleryService.Artwork[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedArtwork, setSelectedArtwork] = useState<galleryService.Artwork | null>(null);
    const [comments, setComments] = useState<galleryService.Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setArtworks(galleryService.getArtworks());
    }, []);

    const filteredArtworks = artworks.filter(art => filter === 'favorites' ? art.isFavorite : true);

    const handleToggleFavorite = (id: string) => {
        playSound(audioService.playToggle);
        const updatedArtworks = galleryService.toggleFavorite(id);
        setArtworks(updatedArtworks);
    };

    const handleDeleteArtwork = (id: string) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานศิลปะชิ้นนี้?')) {
            playSound(audioService.playTrash);
            const updatedArtworks = galleryService.deleteArtwork(id);
            setArtworks(updatedArtworks);
            setSelectedArtwork(null); // Close modal
        }
    };
    
    const openModal = (artwork: galleryService.Artwork) => {
        playSound(audioService.playClick);
        setSelectedArtwork(artwork);
        setComments(galleryService.getComments(artwork.id));
    };

    const closeModal = () => {
        playSound(audioService.playCloseModal);
        setSelectedArtwork(null);
    };

    const handleAddComment = () => {
        if (!selectedArtwork || !newComment.trim()) return;
        playSound(audioService.playClick);
        const updatedComments = galleryService.addComment(selectedArtwork.id, newComment);
        setComments(updatedComments);
        setNewComment('');
    };
    
    const handleCopyPrompt = () => {
        if (!selectedArtwork) return;
        navigator.clipboard.writeText(selectedArtwork.prompt);
        playSound(audioService.playSelection);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
    };

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">แกลเลอรีศิลปะ AI</h1>
            
            <div className="w-full max-w-5xl mb-6 flex justify-center gap-2 font-press-start">
                <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 border-2 text-xs ${filter === 'all' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary text-text-primary'}`}
                >
                    ทั้งหมด ({artworks.length})
                </button>
                <button 
                    onClick={() => setFilter('favorites')}
                    className={`px-4 py-2 border-2 text-xs ${filter === 'favorites' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary text-text-primary'}`}
                >
                    รายการโปรด ({artworks.filter(a => a.isFavorite).length})
                </button>
            </div>

            {filteredArtworks.length > 0 ? (
                <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredArtworks.map(art => (
                        <ArtworkItem 
                            key={art.id} 
                            artwork={art} 
                            onSelect={() => openModal(art)}
                            onToggleFavorite={() => handleToggleFavorite(art.id)}
                            playSound={playSound}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center font-press-start text-brand-light/80 mt-10">
                    <p>{filter === 'all' ? 'แกลเลอรีของคุณว่างเปล่า' : 'คุณยังไม่มีรายการโปรด'}</p>
                    <p className="text-xs mt-2">{filter === 'all' ? 'ไปที่หน้า "สร้างภาพ" เพื่อเริ่มสร้างสรรค์!' : 'กดรูปหัวใจบนภาพเพื่อเพิ่ม'}</p>
                </div>
            )}
            
            <Modal isOpen={!!selectedArtwork} onClose={closeModal} title="รายละเอียดผลงาน">
                {selectedArtwork && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                        {/* Left column: Image and Actions */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-black border-2 border-brand-light">
                                <img src={selectedArtwork.imageDataUrl} alt={selectedArtwork.prompt} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleToggleFavorite(selectedArtwork.id)} className="flex items-center justify-center gap-2 p-2 bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-magenta hover:text-white transition-colors">
                                    {selectedArtwork.isFavorite ? <HeartFilledIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                                    <span className="text-xs hidden sm:inline">โปรด</span>
                                </button>
                                <button disabled className="flex items-center justify-center gap-2 p-2 bg-surface-primary border-2 border-border-primary text-text-primary opacity-50 cursor-not-allowed">
                                    <ShareIcon className="w-5 h-5" />
                                    <span className="text-xs hidden sm:inline">แชร์</span>
                                </button>
                                <button onClick={() => handleDeleteArtwork(selectedArtwork.id)} className="flex items-center justify-center gap-2 p-2 bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-red-500 hover:text-white transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                    <span className="text-xs hidden sm:inline">ลบ</span>
                                </button>
                            </div>
                        </div>

                        {/* Right column: Details and Comments */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <h4 className="font-press-start text-sm text-brand-cyan mb-2">คำสั่ง (Prompt)</h4>
                                <div className="relative">
                                    <p className="text-xs bg-black/30 p-2 border border-brand-light/50 pr-10">{selectedArtwork.prompt}</p>
                                    <button onClick={handleCopyPrompt} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-brand-light hover:text-brand-yellow">
                                        <CopyIcon className="w-5 h-5" />
                                    </button>
                                     {isCopied && <span className="absolute -top-6 right-0 text-xs bg-brand-lime text-black px-1">คัดลอกแล้ว!</span>}
                                </div>
                            </div>
                            <div className="flex-grow flex flex-col">
                                <h4 className="font-press-start text-sm text-brand-cyan mb-2">ความคิดเห็น</h4>
                                <div className="flex-grow bg-black/30 p-2 border border-brand-light/50 overflow-y-auto h-32">
                                    {comments.length > 0 ? (
                                        <ul className="space-y-2 text-xs">
                                            {comments.map(c => (
                                                <li key={c.id} className="border-b border-brand-light/20 pb-1">
                                                    <p>{c.text}</p>
                                                    <p className="text-right text-brand-light/50 text-[10px]">{new Date(c.timestamp).toLocaleTimeString('th-TH')}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-xs text-brand-light/70 text-center">ยังไม่มีความคิดเห็น</p>}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input 
                                        type="text" 
                                        value={newComment} 
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="เพิ่มความคิดเห็น..."
                                        className="flex-grow p-2 bg-brand-light text-black border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" 
                                        onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                    />
                                    <button onClick={handleAddComment} className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-brand-cyan text-black border-2 border-black hover:bg-brand-yellow">
                                        <SendIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
