import React, { useState } from 'react';
import { X, FolderHeart, Star, Tag, Plus, Check, Loader2, FolderPlus } from 'lucide-react';
import { GalleryFolder } from '../types';
import { savePhotoToGallery, createGalleryFolder } from '../services/galleryService';
import { useAuth } from '../context/AuthContext';

interface SaveToGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl: string;
  defaultTitle?: string;
  presetName?: string;
  category?: string;
  folders: GalleryFolder[];
  onSaved: (photoId: string) => void;
}

export const SaveToGalleryModal: React.FC<SaveToGalleryModalProps> = ({
  isOpen,
  onClose,
  currentImageUrl,
  defaultTitle = 'Studio Edit',
  presetName,
  category = 'style',
  folders,
  onSaved,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(defaultTitle);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(['photo', category]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New folder inline creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  if (!isOpen || !user) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return;
    try {
      const folderId = await createGalleryFolder(user.uid, newFolderName.trim());
      setSelectedFolderId(folderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSaving(true);
    try {
      const photoId = await savePhotoToGallery(user.uid, {
        title: title.trim(),
        imageUrl: currentImageUrl,
        folderId: selectedFolderId || undefined,
        favorite: isFavorite,
        tags,
        presetName,
        category,
      });
      onSaved(photoId);
      onClose();
    } catch (err: any) {
      console.error('Failed to save photo to gallery:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderHeart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Save to Personal Gallery</h3>
            <p className="text-[11px] text-neutral-400">Store this edited photo in your cloud gallery</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Photo Preview Thumbnail & Title */}
          <div className="flex gap-4 items-center p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <img
              src={currentImageUrl}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover border border-neutral-800 shrink-0 bg-neutral-900 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Photo Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                placeholder="Name your masterpiece"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              {presetName && (
                <span className="inline-block text-[10px] text-neutral-500 mt-1 truncate">
                  Preset applied: <span className="text-neutral-300 font-medium">{presetName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Folder Selection & Inline Folder Creation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-neutral-400">Organize into Folder</label>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <FolderPlus className="w-3 h-3" />
                {isCreatingFolder ? 'Cancel' : '+ New Folder'}
              </button>
            </div>

            {isCreatingFolder ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950/60 border border-indigo-500/30 mb-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name (e.g. Paris Looks)"
                  maxLength={30}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCreateNewFolder}
                  disabled={!newFolderName.trim()}
                  className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            ) : null}

            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">General Gallery (No folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="flex items-center gap-2">
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'
                }`}
              />
              <span className="text-xs text-neutral-300 font-medium">Mark as Favorite</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isFavorite ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isFavorite ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Cloud...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save to Gallery</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
