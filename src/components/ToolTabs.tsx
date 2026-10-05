import React from 'react';
import { Palette, Shirt, Sparkles, Wand2, SlidersHorizontal, Crop } from 'lucide-react';
import { EditMode } from '../types';

interface ToolTabsProps {
  activeTab: EditMode;
  onSelectTab: (tab: EditMode) => void;
  isProcessing: boolean;
}

export const ToolTabs: React.FC<ToolTabsProps> = ({ activeTab, onSelectTab, isProcessing }) => {
  const tabs: { id: EditMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'style', label: 'AI Styles', icon: Palette },
    { id: 'style-transfer', label: 'Style Transfer', icon: Wand2 },
    { id: 'fashion', label: 'Fashion', icon: Shirt },
    { id: 'enhance', label: 'Enhance', icon: Sparkles },
    { id: 'prompt', label: 'Prompt', icon: Wand2 },
    { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
    { id: 'crop', label: 'Crop', icon: Crop },
  ];

  return (
    <div className="flex border-b border-neutral-800 bg-neutral-900/90 shrink-0 overflow-x-auto no-scrollbar px-2 pt-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`tool-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x -mb-[1px] whitespace-nowrap ${
              isActive
                ? 'bg-neutral-950 text-white border-neutral-800 border-b-transparent shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent hover:bg-neutral-850'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-neutral-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
