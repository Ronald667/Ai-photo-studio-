import React from 'react';
import { X, History, Clock, ArrowRight, RotateCcw, Check, Sparkles } from 'lucide-react';
import { HistoryStep } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryStep[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  currentIndex,
  onSelectStep,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm h-full bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white font-display">Edit History Timeline</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Steps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.map((step, idx) => {
            const isActive = idx === currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <button
                key={step.id}
                id={`history-step-${idx}`}
                onClick={() => {
                  onSelectStep(idx);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center space-x-3 ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30'
                    : isFuture
                    ? 'border-neutral-800/50 bg-neutral-950/30 opacity-50 hover:opacity-100 hover:bg-neutral-850'
                    : 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 hover:border-neutral-700'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700/60">
                  <img
                    src={step.thumbnailUrl || step.imageUrl}
                    alt={step.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white truncate">
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-400">
                    <span>{step.category}</span>
                    <span>•</span>
                    <span>{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 text-center">
          <p className="text-[11px] text-neutral-400">
            Click any snapshot to travel back or branch your edits
          </p>
        </div>
      </div>
    </div>
  );
};
