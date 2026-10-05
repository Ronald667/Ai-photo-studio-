import React, { useState } from 'react';
import { Sparkles, Shirt, Check, Wand2, Crown, Zap, Shield, Sun, Briefcase, Cpu } from 'lucide-react';
import { FashionPreset } from '../../types';
import { FASHION_PRESETS } from '../../data/presets';

interface FashionPanelProps {
  onApplyFashion: (preset: FashionPreset, customDetail?: string) => void;
  onEnhancePrompt: (text: string, mode: 'fashion') => Promise<string>;
  isProcessing: boolean;
}

export const FashionPanel: React.FC<FashionPanelProps> = ({
  onApplyFashion,
  onEnhancePrompt,
  isProcessing,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(FASHION_PRESETS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customWardrobe, setCustomWardrobe] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  const categories = ['All', 'Couture', 'Streetwear', 'Vintage', 'Formal', 'Futuristic'];

  const filteredPresets = FASHION_PRESETS.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const selectedPreset = FASHION_PRESETS.find((p) => p.id === selectedPresetId) || FASHION_PRESETS[0];

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Crown': return <Crown className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Shield': return <Shield className="w-4 h-4" />;
      case 'Sun': return <Sun className="w-4 h-4" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      default: return <Shirt className="w-4 h-4" />;
    }
  };

  const handleMagicEnhance = async () => {
    if (!customWardrobe.trim()) {
      setCustomWardrobe(selectedPreset.name);
    }
    try {
      setIsEnhancing(true);
      const enhanced = await onEnhancePrompt(customWardrobe || selectedPreset.name, 'fashion');
      setCustomWardrobe(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApply = () => {
    onApplyFashion(selectedPreset, customWardrobe.trim() || undefined);
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
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Fashion Cards List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredPresets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                id={`fashion-preset-${preset.id}`}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`group relative p-3 rounded-xl border text-left transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 bg-neutral-900 shadow-md ring-1 ring-purple-500/50'
                    : 'border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                {/* Accent glow */}
                <div
                  className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br ${preset.previewGradient}`}
                />

                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors border border-neutral-700">
                    {renderIcon(preset.iconName)}
                  </div>
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-neutral-500 capitalize">
                      {preset.category}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wardrobe Customization */}
      <div className="border-t border-neutral-800/80 pt-3 shrink-0 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <Shirt className="w-3 h-3 text-purple-400" />
              <span>Custom Garment / Details (Optional)</span>
            </label>
            <button
              onClick={handleMagicEnhance}
              disabled={isEnhancing}
              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
              title="Enhance with Gemini AI"
            >
              <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Enhancing...' : 'Magic Prompt'}</span>
            </button>
          </div>
          <input
            type="text"
            value={customWardrobe}
            onChange={(e) => setCustomWardrobe(e.target.value)}
            placeholder="e.g. Emerald silk lapel, diamond choker, black sunglasses"
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Primary Apply Action */}
        <button
          id="apply-fashion-btn"
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-md shadow-purple-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply {selectedPreset.name} Fashion</span>
        </button>
      </div>
    </div>
  );
};
