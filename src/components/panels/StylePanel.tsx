import React, { useState } from 'react';
import { Sparkles, Palette, Check, Wand2, ArrowRight } from 'lucide-react';
import { StylePreset } from '../../types';
import { STYLE_PRESETS } from '../../data/presets';

interface StylePanelProps {
  onApplyStyle: (preset: StylePreset, customPrompt?: string) => void;
  onEnhancePrompt: (text: string, mode: 'style') => Promise<string>;
  isProcessing: boolean;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  onApplyStyle,
  onEnhancePrompt,
  isProcessing,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(STYLE_PRESETS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customStyleNote, setCustomStyleNote] = useState<string>('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);

  const categories = ['All', 'Popular', 'Futuristic', 'Retro', 'Artistic', 'Cinematic', 'Fine Art'];

  const filteredPresets = STYLE_PRESETS.filter((p) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Popular') return p.badge === 'Popular' || p.badge === 'Trending';
    return p.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const selectedPreset = STYLE_PRESETS.find((p) => p.id === selectedPresetId) || STYLE_PRESETS[0];

  const handleMagicEnhance = async () => {
    if (!customStyleNote.trim()) {
      setCustomStyleNote(selectedPreset.name);
    }
    try {
      setIsEnhancingPrompt(true);
      const enhanced = await onEnhancePrompt(customStyleNote || selectedPreset.name, 'style');
      setCustomStyleNote(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleApply = () => {
    onApplyStyle(selectedPreset, customStyleNote.trim() || undefined);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-3 border-b border-neutral-800 shrink-0 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Style Presets Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {filteredPresets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                id={`style-preset-${preset.id}`}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`group relative p-3 rounded-xl border text-left transition-all overflow-hidden flex flex-col justify-between aspect-[16/11] ${
                  isSelected
                    ? 'border-indigo-500 bg-neutral-900 shadow-md ring-1 ring-indigo-500/50'
                    : 'border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                {/* Background ambient gradient */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br ${preset.previewGradient}`}
                />

                <div className="flex items-center justify-between z-10 w-full mb-1">
                  <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                    {preset.category}
                  </span>
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  ) : preset.badge ? (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-400 border border-neutral-700">
                      {preset.badge}
                    </span>
                  ) : null}
                </div>

                <div className="z-10 mt-auto">
                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Style Detail & Prompt Tuning */}
      <div className="border-t border-neutral-800/80 pt-3 shrink-0 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <Palette className="w-3 h-3 text-indigo-400" />
              <span>Custom Style Detail (Optional)</span>
            </label>
            <button
              onClick={handleMagicEnhance}
              disabled={isEnhancingPrompt}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
              title="Enhance with Gemini AI"
            >
              <Wand2 className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
              <span>{isEnhancingPrompt ? 'Enhancing...' : 'Magic Prompt'}</span>
            </button>
          </div>
          <input
            type="text"
            value={customStyleNote}
            onChange={(e) => setCustomStyleNote(e.target.value)}
            placeholder={`e.g. Add subtle golden sparkles or deeper shadows`}
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Primary Action */}
        <button
          id="apply-style-btn"
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply {selectedPreset.name} Style</span>
        </button>
      </div>
    </div>
  );
};
