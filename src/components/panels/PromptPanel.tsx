import React, { useState } from 'react';
import { Sparkles, Wand2, PlusCircle, RefreshCw, Layers, Sliders, Image as ImageIcon } from 'lucide-react';
import { ASPECT_RATIOS } from '../../data/presets';

interface PromptPanelProps {
  hasImage: boolean;
  onEditWithPrompt: (prompt: string) => void;
  onGenerateNew: (prompt: string, aspectRatio: string) => void;
  onEnhancePrompt: (text: string, mode: 'general') => Promise<string>;
  isProcessing: boolean;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  hasImage,
  onEditWithPrompt,
  onGenerateNew,
  onEnhancePrompt,
  isProcessing,
}) => {
  const [mode, setMode] = useState<'edit' | 'generate'>(hasImage ? 'edit' : 'generate');
  const [promptText, setPromptText] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const promptSuggestions = mode === 'edit'
    ? [
        'Add retro aviator sunglasses and leather jacket',
        'Change background to a neon cyberpunk city at night',
        'Replace background with a sunny Mediterranean beach',
        'Add soft glowing bokeh fairy lights in the background',
        'Transform hair color to platinum blonde with subtle highlights',
        'Turn into a snowy winter scene with gentle snowfall',
      ]
    : [
        'A futuristic cyberpunk fashion model with neon accents, ultra photorealistic 8k',
        'Vintage 1960s Italian sports car parked on the Amalfi coast at sunset',
        'A serene Scandinavian minimalist living room with floor to ceiling windows',
        'High fashion editorial portrait of a woman in an emerald velvet cape',
        'Misty morning in Kyoto bamboo forest with soft golden sunlight rays',
      ];

  const handleEnhance = async () => {
    if (!promptText.trim()) return;
    try {
      setIsEnhancing(true);
      const enriched = await onEnhancePrompt(promptText, 'general');
      setPromptText(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    if (mode === 'edit') {
      onEditWithPrompt(promptText.trim());
    } else {
      onGenerateNew(promptText.trim(), selectedRatio);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 mb-4 shrink-0">
        <button
          type="button"
          onClick={() => setMode('edit')}
          disabled={!hasImage}
          className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            mode === 'edit'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:hover:text-neutral-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Edit Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('generate')}
          className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            mode === 'generate'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-pink-400" />
          <span>Generate New</span>
        </button>
      </div>

      {/* Main Content Area */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        {/* Aspect ratio picker (only when generating new) */}
        {mode === 'generate' && (
          <div className="mb-3 shrink-0">
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['1:1', '4:3', '3:4', '16:9', '9:16'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRatio(r)}
                  className={`py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    selectedRatio === r
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="flex-1 flex flex-col mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-neutral-300">
              {mode === 'edit' ? 'Describe your edit instruction' : 'Describe the image to generate'}
            </label>
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !promptText.trim()}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-40"
              title="Enhance prompt with Gemini AI"
            >
              <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Enhancing...' : 'Magic Prompt'}</span>
            </button>
          </div>

          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={4}
            placeholder={
              mode === 'edit'
                ? 'e.g. Add a retro leather jacket and neon sunglasses, change the background to a Tokyo street in the rain...'
                : 'e.g. An editorial portrait of a cybernetic warrior in golden sunlight, cinematic lighting, 8k resolution...'
            }
            className="w-full flex-1 min-h-[90px] bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
          />
        </div>

        {/* Suggestion Chips */}
        <div className="mb-4 shrink-0">
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
            Quick Ideas
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {promptSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPromptText(suggestion)}
                className="text-[10px] text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 px-2 py-1 rounded-lg transition-colors text-left truncate max-w-full"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          id="submit-prompt-btn"
          type="submit"
          disabled={isProcessing || !promptText.trim()}
          className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {mode === 'edit' ? 'Apply AI Edit to Photo' : 'Generate New Image'}
          </span>
        </button>
      </form>
    </div>
  );
};
