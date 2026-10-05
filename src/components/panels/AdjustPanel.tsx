import React from 'react';
import { SlidersHorizontal, RotateCcw, Check, Sparkles, Sun, Contrast, Droplet, Thermometer, ShieldAlert, Eye } from 'lucide-react';
import { FilterAdjustments } from '../../types';
import { defaultAdjustments } from '../../data/presets';

interface AdjustPanelProps {
  adjustments: FilterAdjustments;
  onChangeAdjustments: (newAdj: FilterAdjustments) => void;
  onBakeAdjustments: () => void;
  isProcessing: boolean;
}

export const AdjustPanel: React.FC<AdjustPanelProps> = ({
  adjustments,
  onChangeAdjustments,
  onBakeAdjustments,
  isProcessing,
}) => {
  const updateAdjustment = (key: keyof FilterAdjustments, val: any) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChangeAdjustments({ ...defaultAdjustments });
  };

  const hasChanges = JSON.stringify(adjustments) !== JSON.stringify(defaultAdjustments);

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      {/* Header with Reset */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800 shrink-0">
        <div>
          <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            Light & Color Adjustments
          </h3>
          <p className="text-[10px] text-neutral-400">Live non-destructive canvas controls</p>
        </div>
        <button
          onClick={handleReset}
          disabled={!hasChanges || isProcessing}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 disabled:opacity-30 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Sliders Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Exposure */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Exposure</span>
            <span className="text-neutral-400 font-mono text-[11px]">
              {adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.exposure}
            onChange={(e) => updateAdjustment('exposure', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Brightness */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Brightness</span>
            <span className="text-neutral-400 font-mono text-[11px]">
              {adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.brightness}
            onChange={(e) => updateAdjustment('brightness', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Contrast</span>
            <span className="text-neutral-400 font-mono text-[11px]">
              {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.contrast}
            onChange={(e) => updateAdjustment('contrast', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Saturation</span>
            <span className="text-neutral-400 font-mono text-[11px]">
              {adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.saturation}
            onChange={(e) => updateAdjustment('saturation', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Warmth / Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Warmth (Temperature)</span>
            <span className="text-neutral-400 font-mono text-[11px]">
              {adjustments.warmth > 0
                ? `Amber +${adjustments.warmth}`
                : adjustments.warmth < 0
                ? `Cool ${adjustments.warmth}`
                : '0'}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.warmth}
            onChange={(e) => updateAdjustment('warmth', Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Sharpness */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Sharpness</span>
            <span className="text-neutral-400 font-mono text-[11px]">{adjustments.sharpness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.sharpness}
            onChange={(e) => updateAdjustment('sharpness', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Vignette */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Vignette</span>
            <span className="text-neutral-400 font-mono text-[11px]">{adjustments.vignette}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.vignette}
            onChange={(e) => updateAdjustment('vignette', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Blur */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Soft Blur</span>
            <span className="text-neutral-400 font-mono text-[11px]">{adjustments.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={adjustments.blur}
            onChange={(e) => updateAdjustment('blur', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Quick Toggles: Grayscale & Invert */}
        <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateAdjustment('grayscale', !adjustments.grayscale)}
            className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between ${
              adjustments.grayscale
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <span>Black & White</span>
            {adjustments.grayscale && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => updateAdjustment('invert', !adjustments.invert)}
            className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between ${
              adjustments.invert
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <span>Invert Colors</span>
            {adjustments.invert && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bake into Permanent Image Step */}
      <div className="border-t border-neutral-800/80 pt-3 mt-3 shrink-0">
        <button
          id="bake-adjustments-btn"
          onClick={onBakeAdjustments}
          disabled={!hasChanges || isProcessing}
          className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5 text-indigo-400" />
          <span>Bake Adjustments into Image</span>
        </button>
      </div>
    </div>
  );
};
