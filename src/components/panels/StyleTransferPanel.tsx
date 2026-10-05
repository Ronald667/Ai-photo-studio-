import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Image as ImageIcon, Sliders, Wand2, Check } from 'lucide-react';

interface StyleTransferPanelProps {
  currentImageUrl: string | null;
  onApplyStyleTransfer: (contentImage: string, styleImage: string, intensity: number, prompt: string) => void;
  isProcessing: boolean;
}

const ICONIC_STYLES = [
  {
    id: 'starry-night',
    name: "Van Gogh's Starry Night",
    description: 'Swirling impasto brushstrokes, deep indigos and brilliant yellows',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    gradient: 'from-blue-600 via-indigo-600 to-amber-500',
  },
  {
    id: 'monet-water-lilies',
    name: "Monet's Water Lilies",
    description: 'Impressionist pastel light, serene water shimmer, soft green & blue hues',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    gradient: 'from-emerald-500 via-teal-500 to-sky-400',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon Vibe',
    description: 'High-contrast futuristic neon pinks, electric cyans and dark shadows',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    gradient: 'from-fuchsia-600 via-purple-600 to-cyan-400',
  },
  {
    id: 'oil-renaissance',
    name: 'Classical Renaissance Oil',
    description: 'Rich chiaroscuro lighting, deep golden tones and master canvas texture',
    url: 'https://images.unsplash.com/photo-1582561214197-cbb2330ac7a0?w=600&auto=format&fit=crop&q=80',
    gradient: 'from-amber-700 via-yellow-600 to-stone-800',
  },
  {
    id: 'watercolor-dream',
    name: 'Ethereal Watercolor',
    description: 'Soft bleeding washes, delicate pigment transitions and fluid paper texture',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    gradient: 'from-pink-400 via-purple-400 to-blue-300',
  },
];

export const StyleTransferPanel: React.FC<StyleTransferPanelProps> = ({
  currentImageUrl,
  onApplyStyleTransfer,
  isProcessing,
}) => {
  const [contentImage, setContentImage] = useState<string | null>(currentImageUrl);
  const [selectedStyleUrl, setSelectedStyleUrl] = useState<string>(ICONIC_STYLES[0].url);
  const [customStyleImage, setCustomStyleImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(0.8);
  const [prompt, setPrompt] = useState<string>('');

  const contentFileRef = useRef<HTMLInputElement>(null);
  const styleFileRef = useRef<HTMLInputElement>(null);

  const handleContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setContentImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomStyleImage(event.target.result);
        setSelectedStyleUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const activeStyle = customStyleImage || selectedStyleUrl;
  const activeContent = contentImage || currentImageUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContent || !activeStyle) return;
    onApplyStyleTransfer(activeContent, activeStyle, intensity, prompt.trim());
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>AI Artistic Style Transfer</span>
        </h3>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Blend the artistic texture, brushstrokes, and color palette of a style reference image onto your content photo.
        </p>
      </div>

      {/* Content & Style Image Selection Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Content Photo */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-300">Content Photo</label>
            <button
              type="button"
              onClick={() => contentFileRef.current?.click()}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Upload className="w-2.5 h-2.5" />
              <span>Change</span>
            </button>
            <input
              ref={contentFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleContentUpload}
            />
          </div>
          <div className="relative aspect-square rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center">
            {activeContent ? (
              <img src={activeContent} alt="Content" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-3">
                <ImageIcon className="w-6 h-6 text-neutral-600 mx-auto mb-1" />
                <span className="text-[10px] text-neutral-500">No photo loaded</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-neutral-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-medium text-neutral-300 border border-neutral-800">
              Content Source
            </div>
          </div>
        </div>

        {/* Style Reference Image */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-300">Style Image</label>
            <button
              type="button"
              onClick={() => styleFileRef.current?.click()}
              className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-1"
            >
              <Upload className="w-2.5 h-2.5" />
              <span>Upload Style</span>
            </button>
            <input
              ref={styleFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleStyleUpload}
            />
          </div>
          <div className="relative aspect-square rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center">
            {activeStyle ? (
              <img src={activeStyle} alt="Style" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-3">
                <ImageIcon className="w-6 h-6 text-neutral-600 mx-auto mb-1" />
                <span className="text-[10px] text-neutral-500">Select or upload style</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-neutral-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-medium text-pink-300 border border-neutral-800">
              Art Style Reference
            </div>
          </div>
        </div>
      </div>

      {/* Iconic Style Presets Picker */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
          Choose Iconic Art Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
          {ICONIC_STYLES.map((style) => {
            const isSelected = selectedStyleUrl === style.url && !customStyleImage;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  setSelectedStyleUrl(style.url);
                  setCustomStyleImage(null);
                }}
                className={`group relative p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2.5 overflow-hidden ${
                  isSelected
                    ? 'border-pink-500 bg-neutral-900 shadow-md ring-1 ring-pink-500/50'
                    : 'border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-700 relative">
                  <img src={style.url} alt={style.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white truncate">{style.name}</h4>
                    {isSelected && <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">{style.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Style Intensity Slider */}
      <div className="space-y-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Style Transfer Intensity</span>
          </label>
          <span className="text-xs font-bold text-indigo-400">{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-500">
          <span>Subtle Blend</span>
          <span>Balanced</span>
          <span>Full Masterpiece</span>
        </div>
      </div>

      {/* Additional Prompt Description */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-neutral-300">Custom Prompt Guidance (Optional)</label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Keep facial features sharp, vibrant color palette"
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Submit Generate Button */}
      <form onSubmit={handleSubmit} className="pt-2">
        <button
          type="submit"
          id="apply-style-transfer-btn"
          disabled={isProcessing || !activeContent || !activeStyle}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 shadow-lg shadow-pink-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isProcessing ? 'Generating Style Transfer...' : 'Generate AI Style Transfer'}</span>
        </button>
      </form>
    </div>
  );
};
