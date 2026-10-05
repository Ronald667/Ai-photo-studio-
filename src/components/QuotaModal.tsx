import React from 'react';
import { Sparkles, X, ShieldAlert, Image as ImageIcon, Upload, Check, Cpu } from 'lucide-react';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSamples: () => void;
  onTriggerUpload: () => void;
  actionAttempted?: string;
  retryAfterSeconds?: number;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  onOpenSamples,
  onTriggerUpload,
  actionAttempted = 'AI Image Operation',
  retryAfterSeconds,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white font-display">
              Gemini Image Generation Quota Notice
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Regarding: <span className="text-neutral-300 font-medium">{actionAttempted}</span>
            </p>
          </div>
        </div>

        {/* Description Box */}
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300 space-y-2 mb-5 leading-relaxed">
          <p>
            Google Gemini image models (<code className="text-indigo-300 bg-indigo-950/50 px-1 py-0.5 rounded">gemini-3.1-flash-image</code>)
            require a <strong>Paid Tier API Key</strong> with billing enabled in your Google Cloud account. Free tier projects have a quota limit of 0 for image generation.
          </p>
          {retryAfterSeconds && (
            <p className="text-amber-400 font-medium">
              Rate limit cooldown: Please retry in ~{retryAfterSeconds} seconds.
            </p>
          )}
        </div>

        {/* What's always available */}
        <div className="mb-6 space-y-2">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Always Available with Neural Canvas Engine:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/50 border border-neutral-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>12 Artistic Styles</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/50 border border-neutral-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>8 Fashion Restyles</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/50 border border-neutral-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Studio Enhancers</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/50 border border-neutral-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>High-Res 4K Export</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenSamples();
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Try Sample Photos</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onTriggerUpload();
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
