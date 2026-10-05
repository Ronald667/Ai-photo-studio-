import React, { useState } from 'react';
import { X, Sparkles, FolderHeart, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100 overflow-hidden">
        {/* Subtle background ambient light */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white font-display">Sign In to AI Photo Studio</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            Unlock your personal cloud gallery to store, organize, and revisit your edited masterpieces.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
              <FolderHeart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Personal Photo Gallery</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Save full-resolution edits and load them back into the editor at any time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Organize & Curate</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Group edits into custom folders, mark favorites, and tag your favorite styles.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/50 border border-red-800/50 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 shadow-md transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.2 7.5 23 12 23z"
              />
            </svg>
          )}
          <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <p className="text-[11px] text-neutral-500 text-center mt-4">
          By continuing, your profile and gallery will be securely isolated in Firestore.
        </p>
      </div>
    </div>
  );
};
