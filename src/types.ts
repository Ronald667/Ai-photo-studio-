export interface FilterAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  exposure: number;   // -100 to 100
  warmth: number;     // -100 to 100 (blue to amber)
  sharpness: number;  // 0 to 100
  blur: number;       // 0 to 20 px
  vignette: number;   // 0 to 100
  sepia: number;      // 0 to 100
  grayscale: boolean;
  invert: boolean;
}

export type EditMode = 'style' | 'style-transfer' | 'fashion' | 'enhance' | 'prompt' | 'adjust' | 'crop';

export interface StylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  previewGradient: string;
  accentColor: string;
  badge?: string;
}

export interface FashionPreset {
  id: string;
  name: string;
  category: 'couture' | 'streetwear' | 'vintage' | 'futuristic' | 'formal' | 'casual';
  description: string;
  prompt: string;
  previewGradient: string;
  iconName: string;
}

export interface EnhancePreset {
  id: string;
  name: string;
  category: 'lighting' | 'portrait' | 'detail' | 'color';
  description: string;
  prompt: string;
  adjustments?: Partial<FilterAdjustments>;
  previewGradient: string;
}

export interface HistoryStep {
  id: string;
  timestamp: number;
  label: string;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  adjustments: FilterAdjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  appliedWith?: 'gemini' | 'canvas';
}

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.1 to 1.0 (for jpeg/webp)
  scale: 1 | 1.5 | 2;
  customWidth?: number;
  customHeight?: number;
  filename: string;
}

export interface SampleImage {
  id: string;
  title: string;
  category: string;
  url: string;
  aspectRatio: string;
  recommendedStyles: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GalleryFolder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GalleryPhoto {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  folderId?: string;
  favorite: boolean;
  tags?: string[];
  prompt?: string;
  presetName?: string;
  category?: string;
  createdAt?: any;
  updatedAt?: any;
}
