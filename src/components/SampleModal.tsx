import React from 'react';
import { X, Sparkles, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { SampleImage } from '../types';
import { SAMPLE_IMAGES } from '../data/presets';

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const SampleModal: React.FC<SampleModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Choose a Sample Photo
              </h2>
              <p className="text-xs text-neutral-400">
                Select a high-resolution curated image to immediately test AI styles, fashion, and enhancements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sample Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {SAMPLE_IMAGES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="group relative rounded-xl overflow-hidden border border-neutral-800 hover:border-indigo-500 bg-neutral-950 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01]"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={sample.url}
                  alt={sample.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {sample.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                      {sample.category}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Ratio: {sample.aspectRatio}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-indigo-600 text-neutral-400 group-hover:text-white flex items-center justify-center transition-colors shadow">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
