import React, { useState, useMemo } from 'react';
import {
  X,
  FolderHeart,
  Star,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Folder,
  Tag,
  Grid3X3,
  FolderPlus,
  Eye,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react';
import { GalleryPhoto, GalleryFolder } from '../types';
import {
  createGalleryFolder,
  deleteGalleryFolder,
  deletePhotoFromGallery,
  updateGalleryPhoto,
} from '../services/galleryService';
import { useAuth } from '../context/AuthContext';
import { PhotoDetailModal } from './PhotoDetailModal';

interface PersonalGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: GalleryPhoto[];
  folders: GalleryFolder[];
  onLoadIntoEditor: (photo: GalleryPhoto) => void;
  onOpenSaveModal: () => void;
}

export const PersonalGalleryModal: React.FC<PersonalGalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  folders,
  onLoadIntoEditor,
  onOpenSaveModal,
}) => {
  const { user, profile, setAuthModalOpen } = useAuth();
  const [activeFolderId, setActiveFolderId] = useState<string>('all'); // 'all' | 'favorites' | folderId
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Selected photo for detail modal
  const [inspectPhoto, setInspectPhoto] = useState<GalleryPhoto | null>(null);

  // New folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#6366f1');

  // Move photo quick menu
  const [movingPhotoId, setMovingPhotoId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    return photos
      .filter((p) => {
        // Folder filter
        if (activeFolderId === 'favorites') {
          if (!p.favorite) return false;
        } else if (activeFolderId !== 'all') {
          if (p.folderId !== activeFolderId) return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (p.category !== selectedCategory) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesPreset = p.presetName?.toLowerCase().includes(q);
          const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesPreset && !matchesTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'title') {
          return a.title.localeCompare(b.title);
        }
        // Timestamp sort
        const timeA = (a.createdAt?.seconds || 0) * 1000 || 0;
        const timeB = (b.createdAt?.seconds || 0) * 1000 || 0;
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [photos, activeFolderId, selectedCategory, searchQuery, sortOrder]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return;
    try {
      const id = await createGalleryFolder(user.uid, newFolderName.trim(), folderColor);
      setActiveFolderId(id);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!user) return;
    if (confirm(`Delete folder "${folderName}"? Photos inside will remain in your general gallery.`)) {
      try {
        await deleteGalleryFolder(user.uid, folderId);
        if (activeFolderId === folderId) {
          setActiveFolderId('all');
        }
      } catch (err) {
        console.error('Failed to delete folder:', err);
      }
    }
  };

  const handleToggleFavorite = async (photo: GalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await updateGalleryPhoto(user.uid, photo.id, { favorite: !photo.favorite });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleMovePhoto = async (photoId: string, targetFolderId: string) => {
    if (!user) return;
    try {
      await updateGalleryPhoto(user.uid, photoId, { folderId: targetFolderId });
      setMovingPhotoId(null);
    } catch (err) {
      console.error('Failed to move photo:', err);
    }
  };

  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm('Delete this photo from your personal gallery?')) {
      try {
        await deletePhotoFromGallery(user.uid, photoId);
      } catch (err) {
        console.error('Failed to delete photo:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Gallery Top Header */}
        <div className="p-4 sm:px-6 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">Personal Photo Gallery</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                View, organize into folders, and reload your edited photos into the studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSaveModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Current Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Folders Sidebar + Photo Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Folders & Albums */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-950/60 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-48 md:max-h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Organize
                </span>
                <button
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  {isCreatingFolder ? 'Cancel' : 'New Folder'}
                </button>
              </div>

              {/* Folder Creation Input */}
              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="p-2.5 rounded-xl bg-neutral-900 border border-indigo-500/30 space-y-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name (e.g. Fashion)"
                    maxLength={30}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setFolderColor(col)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            folderColor === col ? 'scale-125 ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={!newFolderName.trim()}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}

              {/* Navigation Items */}
              <div className="space-y-1">
                {/* All Photos */}
                <button
                  onClick={() => setActiveFolderId('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeFolderId === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    <span>All Photos</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/30 font-semibold">
                    {photos.length}
                  </span>
                </button>

                {/* Favorites */}
                <button
                  onClick={() => setActiveFolderId('favorites')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeFolderId === 'favorites'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                    <span>Favorites</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-900 font-semibold text-neutral-400">
                    {photos.filter((p) => p.favorite).length}
                  </span>
                </button>
              </div>

              {/* Custom Folders Section */}
              <div className="pt-3 border-t border-neutral-800/80">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
                  Folders ({folders.length})
                </span>

                <div className="space-y-1">
                  {folders.length === 0 ? (
                    <p className="text-[11px] text-neutral-400 italic px-2">No custom folders yet</p>
                  ) : (
                    folders.map((folder) => {
                      const count = photos.filter((p) => p.folderId === folder.id).length;
                      const isActive = activeFolderId === folder.id;
                      return (
                        <div
                          key={folder.id}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-neutral-800 text-white border border-neutral-700'
                              : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                          }`}
                          onClick={() => setActiveFolderId(folder.id)}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: folder.color || '#6366f1' }}
                            />
                            <span className="truncate">{folder.name}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400">
                              {count}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-opacity"
                              title="Delete folder"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* User Profile Summary Card at bottom of sidebar */}
            {profile && (
              <div className="pt-4 border-t border-neutral-800/80 mt-4 hidden md:block">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{profile.displayName}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Cloud Synced</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: Search, Category Bar & Photo Cards Grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900/50">
            {/* Search & Filter Bar */}
            <div className="p-3 sm:px-6 border-b border-neutral-800 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, style, or tag..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] py-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'style', label: 'Styles' },
                  { id: 'fashion', label: 'Fashion' },
                  { id: 'enhance', label: 'Remaster' },
                  { id: 'prompt', label: 'Prompts' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <select
                value={sortOrder}
                onChange={(e: any) => setSortOrder(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* Photos Scrollable Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredPhotos.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-center text-neutral-500 mb-3">
                    <FolderHeart className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    {searchQuery ? 'No matching photos found' : 'No photos in this folder'}
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4">
                    {searchQuery
                      ? 'Try clearing the search query or selecting another category.'
                      : 'Edit any photo in the AI Studio and click "Save to Gallery" to build your personal collection.'}
                  </p>
                  <button
                    onClick={onOpenSaveModal}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Save Current Photo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => {
                    const folder = folders.find((f) => f.id === photo.folderId);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => setInspectPhoto(photo)}
                        className="group relative rounded-xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 transition-all overflow-hidden shadow-md cursor-pointer flex flex-col"
                      >
                        {/* Thumbnail View */}
                        <div className="aspect-square bg-neutral-900 relative overflow-hidden">
                          <img
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            {folder ? (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md shadow text-white pointer-events-auto"
                                style={{ backgroundColor: `${folder.color || '#6366f1'}cc` }}
                              >
                                {folder.name}
                              </span>
                            ) : <span />}

                            <button
                              onClick={(e) => handleToggleFavorite(photo, e)}
                              className={`p-1.5 rounded-lg backdrop-blur-md border shadow pointer-events-auto transition-all ${
                                photo.favorite
                                  ? 'bg-amber-500/80 border-amber-400 text-white'
                                  : 'bg-black/60 border-white/10 text-white/70 hover:text-white hover:bg-black/80'
                              }`}
                              title={photo.favorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${photo.favorite ? 'fill-white' : ''}`}
                              />
                            </button>
                          </div>

                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onLoadIntoEditor(photo);
                                onClose();
                              }}
                              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Load in Studio
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectPhoto(photo);
                                }}
                                className="p-1.5 rounded-lg bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingPhotoId(movingPhotoId === photo.id ? null : photo.id);
                                }}
                                className="p-1.5 rounded-lg bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                                title="Organize folder"
                              >
                                <Folder className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) => handleDeletePhoto(photo.id, e)}
                                className="p-1.5 rounded-lg bg-red-950/80 text-red-400 hover:text-red-200 hover:bg-red-900 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Move to Folder Quick Dropdown */}
                            {movingPhotoId === photo.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-neutral-900 border border-neutral-700 shadow-xl z-20 space-y-1"
                              >
                                <span className="text-[10px] font-bold text-neutral-400 block px-1">
                                  Move to folder:
                                </span>
                                <button
                                  onClick={() => handleMovePhoto(photo.id, '')}
                                  className="w-full text-left text-[11px] px-2 py-1 rounded text-neutral-300 hover:bg-neutral-800"
                                >
                                  General (No folder)
                                </button>
                                {folders.map((f) => (
                                  <button
                                    key={f.id}
                                    onClick={() => handleMovePhoto(photo.id, f.id)}
                                    className="w-full text-left text-[11px] px-2 py-1 rounded text-neutral-300 hover:bg-neutral-800 truncate"
                                  >
                                    📁 {f.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Meta Footer */}
                        <div className="p-2.5">
                          <h5 className="text-xs font-semibold text-white truncate" title={photo.title}>
                            {photo.title}
                          </h5>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                            {photo.presetName ? (
                              <span className="text-indigo-400 truncate">{photo.presetName}</span>
                            ) : (
                              <span className="capitalize">{photo.category || 'Edit'}</span>
                            )}
                            {photo.tags && photo.tags.length > 0 && (
                              <span className="text-neutral-500">#{photo.tags[0]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Photo Detail Modal */}
      {inspectPhoto && (
        <PhotoDetailModal
          photo={inspectPhoto}
          folders={folders}
          onClose={() => setInspectPhoto(null)}
          onLoadIntoEditor={onLoadIntoEditor}
          onDeleteSuccess={() => setInspectPhoto(null)}
        />
      )}
    </div>
  );
};
