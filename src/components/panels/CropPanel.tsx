import React from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Check,
  RotateCcw as ResetIcon,
} from 'lucide-react';
import { ASPECT_RATIOS } from '../../data/presets';

interface CropPanelProps {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onToggleFlipH: () => void;
  onToggleFlipV: () => void;
  onResetOrientation: () => void;
  onBakeTransform: () => void;
  onCropAspectRatio: (ratio: number | null) => void;
  isProcessing: boolean;
}

export const CropPanel: React.FC<CropPanelProps> = ({
  rotation,
  flipH,
  flipV,
  onRotateCw,
  onRotateCcw,
  onToggleFlipH,
  onToggleFlipV,
  onResetOrientation,
  onBakeTransform,
  onCropAspectRatio,
  isProcessing,
}) => {
  const hasTransform = rotation !== 0 || flipH || flipV;

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      {/* Rotation & Flip Controls */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Rotate & Flip
          </h3>
          {hasTransform && (
            <button
              onClick={onResetOrientation}
              disabled={isProcessing}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ResetIcon className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={onRotateCcw}
            disabled={isProcessing}
            title="Rotate 90° Counter-Clockwise"
            className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-medium">-90° Left</span>
          </button>

          <button
            onClick={onRotateCw}
            disabled={isProcessing}
            title="Rotate 90° Clockwise"
            className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-medium">+90° Right</span>
          </button>

          <button
            onClick={onToggleFlipH}
            disabled={isProcessing}
            title="Flip Horizontal (Mirror)"
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
              flipH
                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            <FlipHorizontal className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-medium">Flip H</span>
          </button>

          <button
            onClick={onToggleFlipV}
            disabled={isProcessing}
            title="Flip Vertical"
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
              flipV
                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            <FlipVertical className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-medium">Flip V</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Crop Presets */}
      <div className="flex-1 overflow-y-auto pr-1">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
          Aspect Ratio Crop
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map((item) => (
            <button
              key={item.id}
              onClick={() => onCropAspectRatio(item.ratio)}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-850 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-medium text-white group-hover:text-indigo-300 block">
                  {item.label}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {item.ratio ? item.id : 'Full canvas'}
                </span>
              </div>
              <Crop className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Bake Transformation */}
      {hasTransform && (
        <div className="border-t border-neutral-800/80 pt-3 mt-3 shrink-0">
          <button
            id="bake-transform-btn"
            onClick={onBakeTransform}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply & Save Orientation</span>
          </button>
        </div>
      )}
    </div>
  );
};
