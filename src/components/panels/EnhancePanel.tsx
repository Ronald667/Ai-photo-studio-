import React, { useState } from 'react';
import { Sparkles, Sliders, Check, Wand2, Sun, Moon, Eye, Zap, Flame } from 'lucide-react';
import { EnhancePreset, FilterAdjustments } from '../../types';
import { ENHANCE_PRESETS } from '../../data/presets';

interface EnhancePanelProps {
  onApplyEnhance: (preset: EnhancePreset) => void;
  adjustments: FilterAdjustments;
  onChangeAdjustments: (newAdj: FilterAdjustments) => void;
  isProcessing: boolean;
}

export const EnhancePanel: React.FC<EnhancePanelProps> = ({
  onApplyEnhance,
  adjustments,
  onChangeAdjustments,
  isProcessing,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ENHANCE_PRESETS[0].id);

  const selectedPreset = ENHANCE_PRESETS.find((p) => p.id === selectedPresetId) || ENHANCE_PRESETS[0];

  const handleApply = () => {
    onApplyEnhance(selectedPreset);
  };

  const handleSliderChange = (key: keyof FilterAdjustments, val: number) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: val,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      <div className="mb-3 shrink-0">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
          AI Neural Enhancers
        </h3>
        <p className="text-[11px] text-neutral-400">
          Remaster lighting, skin tones, dynamic range, and clarity using Gemini AI models.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ENHANCE_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                id={`enhance-preset-${preset.id}`}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`group relative p-3 rounded-xl border text-left transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-neutral-900 shadow-md ring-1 ring-emerald-500/50'
                    : 'border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br ${preset.previewGradient}`}
                />

                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    {preset.category}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
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

      {/* Quick Fine-Tune Sliders */}
      <div className="border-t border-neutral-800/80 pt-3 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-emerald-400" />
            <span>Live Tuning</span>
          </span>
          <button
            onClick={() =>
              onChangeAdjustments({
                ...adjustments,
                brightness: 0,
                sharpness: 0,
                contrast: 0,
                warmth: 0,
              })
            }
            className="text-[10px] text-neutral-400 hover:text-white"
          >
            Reset sliders
          </button>
        </div>

        {/* Sharpness Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>Sharpness / Clarity</span>
            <span>{adjustments.sharpness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.sharpness}
            onChange={(e) => handleSliderChange('sharpness', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>Dynamic Contrast</span>
            <span>{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={adjustments.contrast}
            onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Apply Primary Button */}
        <button
          id="apply-enhance-btn"
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full mt-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Remaster with {selectedPreset.name}</span>
        </button>
      </div>
    </div>
  );
};
