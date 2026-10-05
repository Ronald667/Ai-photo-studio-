import React from 'react';
import {
  Wand2,
  Undo2,
  Redo2,
  Download,
  Image as ImageIcon,
  History,
  SlidersHorizontal,
  SplitSquareVertical,
  Sparkles,
  Upload,
  FolderHeart,
  BookmarkPlus,
  User as UserIcon,
  LogIn,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBack?: () => void;
  onExit?: () => void;
  onOpenExport: () => void;
  onOpenSamples: () => void;
  onTriggerUpload: () => void;
  onToggleHistory: () => void;
  compareMode: boolean;
  onToggleCompare: () => void;
  isProcessing: boolean;
  aiStatus: { configured: boolean; model: string };
  onOpenQuotaInfo?: () => void;
  onOpenGallery: () => void;
  onOpenSaveGallery: () => void;
  galleryPhotoCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  onExit,
  onOpenExport,
  onOpenSamples,
  onTriggerUpload,
  onToggleHistory,
  compareMode,
  onToggleCompare,
  isProcessing,
  aiStatus,
  onOpenQuotaInfo,
  onOpenGallery,
  onOpenSaveGallery,
  galleryPhotoCount = 0,
}) => {
  const { user, profile, setAuthModalOpen, setProfileModalOpen } = useAuth();

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 gap-2">
      {/* Brand & AI Engine Indicator */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
          <Wand2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white font-display">
              AI Photo Studio
            </h1>
            <button
              onClick={onOpenQuotaInfo}
              title="Click to view Gemini AI model & quota status"
              className="hidden lg:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <Sparkles className="w-2.5 h-2.5" />
              Gemini 3.1
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 hidden xl:block">
            Styles, Fashion, Remaster & Cloud Gallery
          </p>
        </div>
      </div>

      {/* Center Action Toolbar: Back, Exit, Undo, Redo, Compare */}
      {hasImage && (
        <div className="flex items-center space-x-1 bg-neutral-950/60 p-1 rounded-xl border border-neutral-800/80">
          {onBack && (
            <button
              id="back-btn"
              onClick={onBack}
              disabled={!canUndo || isProcessing}
              title="Back to previous step"
              className="px-2 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {onExit && (
            <button
              id="exit-btn"
              onClick={onExit}
              title="Exit current image workspace"
              className="px-2 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}

          <div className="w-[1px] h-4 bg-neutral-800 mx-0.5" />

          <button
            id="undo-btn"
            onClick={onUndo}
            disabled={!canUndo || isProcessing}
            title="Undo (Ctrl+Z)"
            className="p-1.5 sm:p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-300 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            id="redo-btn"
            onClick={onRedo}
            disabled={!canRedo || isProcessing}
            title="Redo (Ctrl+Y)"
            className="p-1.5 sm:p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-300 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-[1px] h-4 bg-neutral-800 mx-0.5" />

          <button
            id="compare-btn"
            onClick={onToggleCompare}
            title={compareMode ? 'Exit Split View' : 'Split Screen Before/After'}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              compareMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compare</span>
          </button>

          <button
            id="history-btn"
            onClick={onToggleHistory}
            title="Edit History Timeline"
            className="p-1.5 sm:p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* Right Controls: Gallery, Save, Upload, Export, Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Personal Gallery Access Button */}
        <button
          id="gallery-btn"
          onClick={onOpenGallery}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 transition-all flex items-center space-x-1.5"
          title="Open Personal Photo Gallery"
        >
          <FolderHeart className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline font-semibold">Gallery</span>
          {galleryPhotoCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              {galleryPhotoCount}
            </span>
          )}
        </button>

        {/* Save Current Image to Gallery */}
        {hasImage && (
          <button
            id="save-gallery-btn"
            onClick={onOpenSaveGallery}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 transition-all flex items-center space-x-1.5"
            title="Save this photo into your cloud gallery"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save</span>
          </button>
        )}

        {/* Sample Photos */}
        <button
          id="sample-photos-btn"
          onClick={onOpenSamples}
          disabled={isProcessing}
          className="hidden md:flex px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 transition-all items-center space-x-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
          <span>Samples</span>
        </button>

        {/* Upload */}
        <button
          id="upload-new-btn"
          onClick={onTriggerUpload}
          disabled={isProcessing}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 transition-all flex items-center space-x-1.5"
        >
          <Upload className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Export & Share */}
        {hasImage && (
          <button
            id="export-open-btn"
            onClick={onOpenExport}
            disabled={isProcessing}
            className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-md shadow-indigo-600/25 transition-all flex items-center space-x-1.5 active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* User Profile / Authentication Button */}
        {user ? (
          <button
            id="user-profile-btn"
            onClick={() => setProfileModalOpen(true)}
            title={`Signed in as ${profile?.displayName || user.displayName || user.email}`}
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 transition-all"
          >
            {profile?.photoURL || user.photoURL ? (
              <img
                src={profile?.photoURL || user.photoURL || ''}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
                {(profile?.displayName || user.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-white max-w-[80px] truncate hidden sm:inline">
              {(profile?.displayName || user.displayName || 'Creator').split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            id="sign-in-btn"
            onClick={() => setAuthModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

