import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Sparkles, FolderHeart, Star, LogOut, Check, Edit3, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  onOpenGallery: () => void;
  photoCount: number;
  favoriteCount: number;
  folderCount: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onOpenGallery,
  photoCount,
  favoriteCount,
  folderCount,
}) => {
  const { user, profile, profileModalOpen, setProfileModalOpen, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!profileModalOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileModalOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setProfileModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Avatar Area */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            {profile?.photoURL || user.photoURL ? (
              <img
                src={profile?.photoURL || user.photoURL || ''}
                alt={profile?.displayName || 'User Avatar'}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/30 shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                {(profile?.displayName || user.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-neutral-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          <h3 className="text-lg font-bold text-white font-display">
            {profile?.displayName || user.displayName || 'AI Creator'}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
            <Mail className="w-3.5 h-3.5 text-neutral-500" />
            <span>{user.email}</span>
          </div>
          {profile?.bio && !isEditing && (
            <p className="text-xs text-neutral-300 mt-2 italic px-4 text-center">
              "{profile.bio}"
            </p>
          )}
        </div>

        {/* Gallery Statistics Banner */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 mb-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-indigo-400 text-sm font-bold">
              <FolderHeart className="w-3.5 h-3.5" />
              <span>{photoCount}</span>
            </div>
            <span className="text-[10px] text-neutral-400 mt-0.5">Saved Photos</span>
          </div>
          <div className="flex flex-col items-center border-x border-neutral-800/80 px-2">
            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400/20" />
              <span>{favoriteCount}</span>
            </div>
            <span className="text-[10px] text-neutral-400 mt-0.5">Favorites</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-violet-400 text-sm font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{folderCount}</span>
            </div>
            <span className="text-[10px] text-neutral-400 mt-0.5">Folders</span>
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3 mb-6 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                maxLength={60}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Artist Bio / Tagline
              </label>
              <textarea
                value={bio}
                maxLength={200}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short bio or style focus..."
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between mb-6 px-1">
            <button
              onClick={() => {
                setDisplayName(profile?.displayName || user.displayName || '');
                setBio(profile?.bio || '');
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile Details
            </button>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <Check className="w-3 h-3" /> Profile updated!
              </span>
            )}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              setProfileModalOpen(false);
              onOpenGallery();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <FolderHeart className="w-4 h-4" />
            Open My Personal Gallery
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
