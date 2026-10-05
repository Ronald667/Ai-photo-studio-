import React, { useState } from 'react';
import {
  X,
  Star,
  FolderHeart,
  Calendar,
  Download,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  ExternalLink,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { GalleryPhoto, GalleryFolder } from '../types';
import { updateGalleryPhoto, deletePhotoFromGallery } from '../services/galleryService';
import { useAuth } from '../context/AuthContext';

interface PhotoDetailModalProps {
  photo: GalleryPhoto | null;
  folders: GalleryFolder[];
  onClose: () => void;
  onLoadIntoEditor: (photo: GalleryPhoto) => void;
  onDeleteSuccess: (photoId: string) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  folders,
  onClose,
  onLoadIntoEditor,
  onDeleteSuccess,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(photo?.title || '');
  const [folderId, setFolderId] = useState(photo?.folderId || '');
  const [isFavorite, setIsFavorite] = useState(photo?.favorite || false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!photo || !user) return null;

  const currentFolder = folders.find((f) => f.id === photo.folderId);

  const handleToggleFavorite = async () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    try {
      await updateGalleryPhoto(user.uid, photo.id, { favorite: nextFav });
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateGalleryPhoto(user.uid, photo.id, {
        title: title.trim(),
        folderId: folderId || '',
        favorite: isFavorite,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update photo details:', err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePhotoFromGallery(user.uid, photo.id);
      onDeleteSuccess(photo.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete photo:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, '_') || 'gallery_photo'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-700/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Photo Visualizer */}
        <div className="md:w-3/5 bg-neutral-950 flex items-center justify-center p-4 relative min-h-[300px] max-h-[55vh] md:max-h-[92vh] overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          />
          <button
            onClick={handleToggleFavorite}
            className={`absolute bottom-4 left-4 p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all ${
              isFavorite
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-neutral-900/80 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Right Side: Photo Information & Action Panel */}
        <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-[92vh] bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-800">
          <div className="space-y-4">
            {/* Title & Edit Toggle */}
            <div className="flex items-start justify-between gap-3">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No folder (General)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white font-display truncate">
                    {photo.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {currentFolder ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                        📁 {currentFolder.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400">General Gallery</span>
                    )}
                    {photo.category && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {photo.category}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
                  title="Edit title & folder"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {photo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-800/80 text-neutral-300 border border-neutral-700/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Preset & Prompt Info */}
            {photo.presetName && (
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preset: {photo.presetName}</span>
                </div>
                {photo.prompt && (
                  <p className="text-[11px] text-neutral-400 italic line-clamp-3">
                    "{photo.prompt}"
                  </p>
                )}
              </div>
            )}

            {/* Metadata Badges */}
            <div className="text-[11px] text-neutral-400 space-y-1 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span>Stored in Cloud</span>
                <span className="text-emerald-400 font-medium">Firestore Synced</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Resolution</span>
                <span className="text-neutral-300">High-Fidelity Studio</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-neutral-800 mt-4">
            <button
              onClick={() => {
                onLoadIntoEditor(photo);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Photo into AI Studio
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="py-2 px-3 rounded-xl text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              {confirmDelete ? (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="py-2 px-3 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
