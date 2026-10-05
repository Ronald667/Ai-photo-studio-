import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  EditMode,
  FilterAdjustments,
  HistoryStep,
  StylePreset,
  FashionPreset,
  EnhancePreset,
  SampleImage,
} from './types';
import {
  defaultAdjustments,
  SAMPLE_IMAGES,
  STYLE_PRESETS,
} from './data/presets';
import {
  loadImage,
  renderProcessedCanvas,
  applyClientStyleFilter,
  applyClientFashionFilter,
  applyClientEnhanceFilter,
  applyClientPromptFilter,
  fileToBase64,
} from './utils/imageProcessing';

import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { ToolTabs } from './components/ToolTabs';
import { StylePanel } from './components/panels/StylePanel';
import { StyleTransferPanel } from './components/panels/StyleTransferPanel';
import { FashionPanel } from './components/panels/FashionPanel';
import { EnhancePanel } from './components/panels/EnhancePanel';
import { PromptPanel } from './components/panels/PromptPanel';
import { AdjustPanel } from './components/panels/AdjustPanel';
import { CropPanel } from './components/panels/CropPanel';
import { ExportModal } from './components/ExportModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SampleModal } from './components/SampleModal';
import { QuotaModal } from './components/QuotaModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SaveToGalleryModal } from './components/SaveToGalleryModal';
import { PersonalGalleryModal } from './components/PersonalGalleryModal';
import { useAuth } from './context/AuthContext';
import { GalleryPhoto, GalleryFolder } from './types';
import { subscribeToPhotos, subscribeToFolders } from './services/galleryService';
import { Sparkles, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function App() {
  const { user, setAuthModalOpen } = useAuth();

  // Personal Gallery State (Firestore Synced)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [galleryModalOpen, setGalleryModalOpen] = useState<boolean>(false);
  const [saveToGalleryModalOpen, setSaveToGalleryModalOpen] = useState<boolean>(false);
  // Main Image States
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Transformations & Filter Adjustments
  const [adjustments, setAdjustments] = useState<FilterAdjustments>({ ...defaultAdjustments });
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // History & Undo / Redo
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // UI state
  const [activeTab, setActiveTab] = useState<EditMode>('style');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  // Modals & Drawers
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState<boolean>(false);
  const [quotaDetails, setQuotaDetails] = useState<{ action: string; retryAfter?: number }>({
    action: 'AI Image Processing',
  });

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // AI server health status
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; model: string }>({
    configured: true,
    model: 'gemini-3.1-flash-image',
  });

  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message });
  }, []);

  // Dismiss toast automatically
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.status === 'ok') {
          setAiStatus({
            configured: data.aiConfigured,
            model: 'gemini-3.1-flash-image',
          });
        }
      })
      .catch((err) => console.warn('Server health check error:', err));
  }, []);

  // Subscribe to personal gallery photos and folders in Firestore
  useEffect(() => {
    if (!user) {
      setPhotos([]);
      setFolders([]);
      return;
    }

    const unsubPhotos = subscribeToPhotos(user.uid, (data) => {
      setPhotos(data);
    });

    const unsubFolders = subscribeToFolders(user.uid, (data) => {
      setFolders(data);
    });

    return () => {
      unsubPhotos?.();
      unsubFolders?.();
    };
  }, [user]);

  const handleOpenSaveGallery = () => {
    if (!currentImageUrl) {
      showToast('No active photo to save. Upload or edit a photo first!', 'info');
      return;
    }
    if (!user) {
      showToast('Sign in to save your photos to your personal cloud gallery!', 'info');
      setAuthModalOpen(true);
      return;
    }
    setSaveToGalleryModalOpen(true);
  };

  const handleOpenGallery = () => {
    if (!user) {
      showToast('Sign in to access your personal photo gallery!', 'info');
      setAuthModalOpen(true);
      return;
    }
    setGalleryModalOpen(true);
  };

  const handleLoadPhotoFromGallery = (photo: GalleryPhoto) => {
    loadNewImage(photo.imageUrl, photo.title);
    showToast(`Loaded "${photo.title}" into AI Studio!`, 'success');
  };

  // Helper: Create thumbnail from image URL
  const generateThumbnail = async (url: string): Promise<string> => {
    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      const size = 96;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return url;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      return url;
    }
  };

  // Push new state onto history
  const recordHistory = useCallback(
    async (
      newImageUrl: string,
      label: string,
      category: string,
      newAdjustments = { ...defaultAdjustments },
      newRot = 0,
      newH = false,
      newV = false,
      appliedWith: 'gemini' | 'canvas' = 'gemini'
    ) => {
      const thumb = await generateThumbnail(newImageUrl);
      const newStep: HistoryStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        label,
        category,
        imageUrl: newImageUrl,
        thumbnailUrl: thumb,
        adjustments: newAdjustments,
        rotation: newRot,
        flipH: newH,
        flipV: newV,
        appliedWith,
      };

      setHistory((prev) => {
        // Slice forward history if we are currently at an earlier index
        const updated = prev.slice(0, historyIndex + 1);
        return [...updated, newStep];
      });
      setHistoryIndex((prev) => prev + 1);

      setCurrentImageUrl(newImageUrl);
      setAdjustments(newAdjustments);
      setRotation(newRot);
      setFlipH(newH);
      setFlipV(newV);
    },
    [historyIndex]
  );

  // Initialize new photo (upload or sample)
  const loadNewImage = useCallback(
    async (url: string, label = 'Original Photo') => {
      setOriginalImageUrl(url);
      setCurrentImageUrl(url);
      setAdjustments({ ...defaultAdjustments });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setCompareMode(false);

      const thumb = await generateThumbnail(url);
      const initialStep: HistoryStep = {
        id: `initial-${Date.now()}`,
        timestamp: Date.now(),
        label,
        category: 'Source',
        imageUrl: url,
        thumbnailUrl: thumb,
        adjustments: { ...defaultAdjustments },
        rotation: 0,
        flipH: false,
        flipV: false,
      };

      setHistory([initialStep]);
      setHistoryIndex(0);
      showToast(`Loaded ${label}`, 'success');
    },
    [showToast]
  );

  // Handle uploaded files (drag drop or file picker)
  const handleDropFiles = useCallback(
    async (files: FileList) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file (PNG, JPEG, WebP, etc.)', 'error');
        return;
      }
      try {
        setIsProcessing(true);
        setProcessingMessage('Importing high resolution image...');
        const b64 = await fileToBase64(file);
        await loadNewImage(b64, file.name);
      } catch (err: any) {
        showToast(`Failed to upload file: ${err?.message || err}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    },
    [loadNewImage, showToast]
  );

  // Global Clipboard Paste Handler (Ctrl+V anywhere in app)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleDropFiles(e.clipboardData.files);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleDropFiles]);

  // Keyboard shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          handleRedo();
        } else {
          // Undo
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Undo / Redo Actions
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const step = history[targetIndex];
      setHistoryIndex(targetIndex);
      setCurrentImageUrl(step.imageUrl);
      setAdjustments(step.adjustments);
      setRotation(step.rotation);
      setFlipH(step.flipH);
      setFlipV(step.flipV);
      showToast(`Reverted to "${step.label}"`, 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const step = history[targetIndex];
      setHistoryIndex(targetIndex);
      setCurrentImageUrl(step.imageUrl);
      setAdjustments(step.adjustments);
      setRotation(step.rotation);
      setFlipH(step.flipH);
      setFlipV(step.flipV);
      showToast(`Applied "${step.label}"`, 'info');
    }
  };

  // Jump to specific history step from drawer
  const handleSelectHistoryStep = (index: number) => {
    if (index >= 0 && index < history.length) {
      const step = history[index];
      setHistoryIndex(index);
      setCurrentImageUrl(step.imageUrl);
      setAdjustments(step.adjustments);
      setRotation(step.rotation);
      setFlipH(step.flipH);
      setFlipV(step.flipV);
    }
  };

  // Helper: Prepare current base64 image for server payload
  const prepareImageForApi = async (): Promise<string> => {
    if (!currentImageUrl) throw new Error('No active image');
    // If adjustments or rotation exist, bake them before sending to AI
    const hasAdjustments =
      adjustments.brightness !== 0 ||
      adjustments.contrast !== 0 ||
      adjustments.saturation !== 0 ||
      adjustments.warmth !== 0 ||
      adjustments.exposure !== 0 ||
      adjustments.vignette !== 0 ||
      adjustments.sharpness !== 0 ||
      rotation !== 0 ||
      flipH ||
      flipV;

    const img = await loadImage(currentImageUrl);
    if (hasAdjustments) {
      const canvas = await renderProcessedCanvas(img, adjustments, rotation, flipH, flipV);
      return canvas.toDataURL('image/jpeg', 0.92);
    }

    // Scale down if image is huge (> 1800px) to ensure fast network payload
    const maxDim = 1800;
    if (img.width > maxDim || img.height > maxDim) {
      const scale = maxDim / Math.max(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.92);
    }

    return currentImageUrl;
  };

  // 1. Apply AI Style
  const handleApplyStyle = async (preset: StylePreset, customPrompt?: string) => {
    if (!currentImageUrl) {
      showToast('Please upload an image first', 'info');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingMessage(`Transforming photo into ${preset.name} with Gemini AI...`);

      const payloadBase64 = await prepareImageForApi();

      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadBase64,
          editType: 'style',
          stylePreset: `${preset.name} - ${preset.prompt}`,
          prompt: customPrompt,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        await recordHistory(
          data.imageUrl,
          `${preset.name} Style`,
          'AI Style',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'gemini'
        );
        showToast(`Applied ${preset.name} style!`, 'success');
      } else {
        // Fallback to client-side filter engine
        console.warn('AI cloud style failed, utilizing Canvas Neural Engine fallback:', data.error);
        const img = await loadImage(currentImageUrl);
        const fallbackUrl = await applyClientStyleFilter(img, preset.id);
        await recordHistory(
          fallbackUrl,
          `${preset.name} (Filter Engine)`,
          'Canvas Style',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'canvas'
        );
        showToast(`Applied ${preset.name} with Canvas Neural Filter!`, 'info');
      }
    } catch (err: any) {
      console.warn('Style application error, using fallback:', err);
      // Client-side fallback
      const img = await loadImage(currentImageUrl);
      const fallbackUrl = await applyClientStyleFilter(img, preset.id);
      await recordHistory(
        fallbackUrl,
        `${preset.name} (Filter)`,
        'Canvas Style',
        { ...defaultAdjustments },
        0,
        false,
        false,
        'canvas'
      );
      showToast(`Applied ${preset.name} filter`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Apply AI Fashion
  const handleApplyFashion = async (preset: FashionPreset, customDetail?: string) => {
    if (!currentImageUrl) {
      showToast('Please upload an image first', 'info');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingMessage(`Restyling wardrobe into ${preset.name} with Gemini AI...`);

      const payloadBase64 = await prepareImageForApi();

      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadBase64,
          editType: 'fashion',
          fashionPreset: `${preset.name}: ${preset.prompt}`,
          prompt: customDetail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        await recordHistory(
          data.imageUrl,
          `${preset.name} Fashion`,
          'AI Fashion',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'gemini'
        );
        showToast(`Transformed into ${preset.name} Fashion!`, 'success');
      } else {
        // Fallback to client-side fashion neural engine
        console.warn('AI cloud fashion unavailable or quota limit, utilizing Canvas Fashion Engine fallback:', data?.error);
        const img = await loadImage(currentImageUrl);
        const fallbackUrl = await applyClientFashionFilter(img, preset.id);
        await recordHistory(
          fallbackUrl,
          `${preset.name} (Fashion Engine)`,
          'Canvas Fashion',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'canvas'
        );
        showToast(`Applied ${preset.name} with Canvas Fashion Engine!`, 'info');
      }
    } catch (err: any) {
      console.warn('Fashion application error, using fallback:', err);
      const img = await loadImage(currentImageUrl);
      const fallbackUrl = await applyClientFashionFilter(img, preset.id);
      await recordHistory(
        fallbackUrl,
        `${preset.name} (Fashion)`,
        'Canvas Fashion',
        { ...defaultAdjustments },
        0,
        false,
        false,
        'canvas'
      );
      showToast(`Applied ${preset.name} fashion filter`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Apply AI Enhance
  const handleApplyEnhance = async (preset: EnhancePreset) => {
    if (!currentImageUrl) {
      showToast('Please upload an image first', 'info');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingMessage(`Remastering image with ${preset.name}...`);

      const payloadBase64 = await prepareImageForApi();

      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadBase64,
          editType: 'enhance',
          enhancePreset: `${preset.name}: ${preset.prompt}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        await recordHistory(
          data.imageUrl,
          `${preset.name}`,
          'AI Enhance',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'gemini'
        );
        showToast(`Photo enhanced with ${preset.name}!`, 'success');
      } else {
        // Fallback to client-side studio remaster engine
        console.warn('AI cloud enhance unavailable or quota limit, utilizing Canvas Studio Remaster fallback:', data?.error);
        const img = await loadImage(currentImageUrl);
        const fallbackUrl = await applyClientEnhanceFilter(img, preset.id);
        const mergedAdjustments = {
          ...defaultAdjustments,
          ...(preset.adjustments || {}),
        };
        await recordHistory(
          fallbackUrl,
          `${preset.name} (Remaster)`,
          'Canvas Enhance',
          mergedAdjustments,
          0,
          false,
          false,
          'canvas'
        );
        if (preset.adjustments) {
          setAdjustments((prev) => ({ ...prev, ...preset.adjustments }));
        }
        showToast(`Photo remastered with ${preset.name}!`, 'info');
      }
    } catch (err: any) {
      console.warn('Enhance application error, using fallback:', err);
      const img = await loadImage(currentImageUrl);
      const fallbackUrl = await applyClientEnhanceFilter(img, preset.id);
      await recordHistory(
        fallbackUrl,
        `${preset.name} (Remaster)`,
        'Canvas Enhance',
        { ...defaultAdjustments, ...(preset.adjustments || {}) },
        0,
        false,
        false,
        'canvas'
      );
      if (preset.adjustments) {
        setAdjustments((prev) => ({ ...prev, ...preset.adjustments }));
      }
      showToast(`Photo enhanced with ${preset.name}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Edit with Custom Prompt
  const handleEditWithPrompt = async (promptText: string) => {
    if (!currentImageUrl) return;

    try {
      setIsProcessing(true);
      setProcessingMessage(`Applying AI edit: "${promptText.slice(0, 30)}..."`);

      const payloadBase64 = await prepareImageForApi();

      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadBase64,
          editType: 'custom',
          prompt: promptText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        await recordHistory(
          data.imageUrl,
          `Prompt: ${promptText.slice(0, 20)}...`,
          'AI Edit',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'gemini'
        );
        showToast('AI edit successfully applied!', 'success');
      } else {
        // Fallback to client-side semantic prompt filter
        console.warn('AI cloud prompt edit unavailable or quota limit, utilizing Canvas filter fallback:', data?.error);
        const img = await loadImage(currentImageUrl);
        const fallbackUrl = await applyClientPromptFilter(img, promptText);
        await recordHistory(
          fallbackUrl,
          `Filter: ${promptText.slice(0, 20)}...`,
          'Prompt Filter',
          { ...defaultAdjustments },
          0,
          false,
          false,
          'canvas'
        );
        showToast(`Applied aesthetic filter matching "${promptText.slice(0, 25)}..."!`, 'info');
      }
    } catch (err: any) {
      console.warn('Prompt edit error, using fallback:', err);
      const img = await loadImage(currentImageUrl);
      const fallbackUrl = await applyClientPromptFilter(img, promptText);
      await recordHistory(
        fallbackUrl,
        `Filter: ${promptText.slice(0, 20)}...`,
        'Prompt Filter',
        { ...defaultAdjustments },
        0,
        false,
        false,
        'canvas'
      );
      showToast(`Applied aesthetic filter for "${promptText.slice(0, 25)}..."`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Generate Brand New Image from Prompt (Text-to-Image)
  const handleGenerateNew = async (promptText: string, aspectRatio: string) => {
    try {
      setIsProcessing(true);
      setProcessingMessage(`Generating high resolution image with Gemini AI...`);

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio,
          imageSize: '1K',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        await loadNewImage(data.imageUrl, `Generated: ${promptText.slice(0, 20)}...`);
        showToast('Generated new image from prompt!', 'success');
      } else {
        if (response.status === 429 || data?.isQuotaExceeded) {
          setQuotaDetails({
            action: 'Text-to-Image Generation',
            retryAfter: data.retryAfter,
          });
          setQuotaModalOpen(true);
          showToast('Gemini Image Quota: Paid tier required for generation. See options.', 'info');
        } else {
          throw new Error(data.message || data.error || 'Failed to generate image');
        }
      }
    } catch (err: any) {
      showToast(`Image generation error: ${err?.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle AI Style Transfer
  const handleApplyStyleTransfer = async (contentImage: string, styleImage: string, intensity: number, promptText: string) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Blending content with artistic style using Gemini AI...');

      const response = await fetch('/api/ai/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentImageBase64: contentImage,
          styleImageBase64: styleImage,
          styleIntensity: intensity,
          prompt: promptText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        await loadNewImage(data.imageUrl, `Style Transfer: ${Math.round(intensity * 100)}%`);
        showToast('AI style transfer successfully generated!', 'success');
      } else {
        if (response.status === 429 || data?.isQuotaExceeded) {
          setQuotaDetails({
            action: 'AI Style Transfer',
            retryAfter: data.retryAfter,
          });
          setQuotaModalOpen(true);
          showToast('Gemini Image Quota: Paid tier required for style transfer.', 'info');
        } else {
          throw new Error(data.message || data.error || 'Failed to generate style transfer');
        }
      }
    } catch (err: any) {
      showToast(`Style transfer error: ${err?.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Magic Prompt Enhancer
  const handleEnhancePrompt = async (text: string, mode: 'style' | 'fashion' | 'general' = 'general'): Promise<string> => {
    try {
      const res = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, mode }),
      });
      const data = await res.json();
      if (res.ok && data.enhancedPrompt) {
        return data.enhancedPrompt;
      }
      return text;
    } catch (err) {
      console.warn('Prompt enhancement error:', err);
      return text;
    }
  };

  // 7. Bake Adjustments
  const handleBakeAdjustments = async () => {
    if (!currentImageUrl) return;
    try {
      setIsProcessing(true);
      setProcessingMessage('Baking color adjustments into permanent layer...');
      const img = await loadImage(currentImageUrl);
      const canvas = await renderProcessedCanvas(img, adjustments, rotation, flipH, flipV);
      const bakedUrl = canvas.toDataURL('image/png');

      await recordHistory(
        bakedUrl,
        'Baked Adjustments',
        'Color Layer',
        { ...defaultAdjustments },
        0,
        false,
        false,
        'canvas'
      );
      showToast('Adjustments baked into image!', 'success');
    } catch (err: any) {
      showToast(`Failed to bake adjustments: ${err?.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 8. Bake Transformation (Rotation & Flip)
  const handleBakeTransform = async () => {
    if (!currentImageUrl) return;
    try {
      setIsProcessing(true);
      setProcessingMessage('Applying rotation & flip orientation...');
      const img = await loadImage(currentImageUrl);
      const canvas = await renderProcessedCanvas(img, { ...defaultAdjustments }, rotation, flipH, flipV);
      const bakedUrl = canvas.toDataURL('image/png');

      await recordHistory(
        bakedUrl,
        `Rotated ${rotation}° ${flipH ? 'Flip' : ''}`,
        'Orientation',
        adjustments,
        0,
        false,
        false,
        'canvas'
      );
      showToast('Orientation applied to image!', 'success');
    } catch (err: any) {
      showToast(`Failed to save orientation: ${err?.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 9. Crop Aspect Ratio
  const handleCropAspectRatio = async (targetRatio: number | null) => {
    if (!currentImageUrl) return;
    if (targetRatio === null) return;

    try {
      setIsProcessing(true);
      setProcessingMessage('Cropping image to selected aspect ratio...');
      const img = await loadImage(currentImageUrl);

      const srcW = img.width;
      const srcH = img.height;
      const srcRatio = srcW / srcH;

      let cropW = srcW;
      let cropH = srcH;

      if (srcRatio > targetRatio) {
        // Image is wider than target
        cropW = Math.round(srcH * targetRatio);
      } else {
        // Image is taller than target
        cropH = Math.round(srcW / targetRatio);
      }

      const sx = Math.round((srcW - cropW) / 2);
      const sy = Math.round((srcH - cropH) / 2);

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

      const croppedUrl = canvas.toDataURL('image/png');
      await recordHistory(
        croppedUrl,
        `Cropped ${Math.round(cropW)}×${Math.round(cropH)}`,
        'Crop',
        adjustments,
        rotation,
        flipH,
        flipV,
        'canvas'
      );
      showToast('Cropped successfully!', 'success');
    } catch (err: any) {
      showToast(`Crop failed: ${err?.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* Hidden file input for header upload button */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif, image/avif"
        className="hidden"
        onChange={(e) => e.target.files && handleDropFiles(e.target.files)}
      />

      {/* Top Header */}
      <Header
        hasImage={Boolean(currentImageUrl)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBack={historyIndex > 0 ? handleUndo : undefined}
        onExit={() => {
          setCurrentImageUrl(null);
          setHistory([]);
          setHistoryIndex(-1);
        }}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenSamples={() => setSampleModalOpen(true)}
        onTriggerUpload={() => hiddenFileInputRef.current?.click()}
        onToggleHistory={() => setHistoryDrawerOpen(true)}
        compareMode={compareMode}
        onToggleCompare={() => setCompareMode(!compareMode)}
        isProcessing={isProcessing}
        aiStatus={aiStatus}
        onOpenQuotaInfo={() => setQuotaModalOpen(true)}
        onOpenGallery={handleOpenGallery}
        onOpenSaveGallery={handleOpenSaveGallery}
        galleryPhotoCount={photos.length}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Canvas Viewport (Center / Main) */}
        <div className="flex-1 h-full overflow-hidden relative order-1 md:order-1">
          <CanvasViewport
            currentImageUrl={currentImageUrl}
            originalImageUrl={originalImageUrl}
            adjustments={adjustments}
            rotation={rotation}
            flipH={flipH}
            flipV={flipV}
            isProcessing={isProcessing}
            processingMessage={processingMessage}
            compareMode={compareMode}
            onToggleCompare={() => setCompareMode(!compareMode)}
            onDropFiles={handleDropFiles}
            onSelectSample={(sample) => loadNewImage(sample.url, sample.title)}
            sampleImages={SAMPLE_IMAGES}
          />
        </div>

        {/* Tools Sidebar Panel (Right) */}
        {currentImageUrl && (
          <aside className="w-full md:w-84 lg:w-96 h-80 md:h-full border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-950/90 backdrop-blur-md flex flex-col shrink-0 z-20 order-2 md:order-2 shadow-2xl">
            {/* Tool Category Tabs */}
            <ToolTabs
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isProcessing={isProcessing}
            />

            {/* Panel Body */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'style' && (
                <StylePanel
                  onApplyStyle={handleApplyStyle}
                  onEnhancePrompt={(text) => handleEnhancePrompt(text, 'style')}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'style-transfer' && (
                <StyleTransferPanel
                  currentImageUrl={currentImageUrl}
                  onApplyStyleTransfer={handleApplyStyleTransfer}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'fashion' && (
                <FashionPanel
                  onApplyFashion={handleApplyFashion}
                  onEnhancePrompt={(text) => handleEnhancePrompt(text, 'fashion')}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'enhance' && (
                <EnhancePanel
                  onApplyEnhance={handleApplyEnhance}
                  adjustments={adjustments}
                  onChangeAdjustments={setAdjustments}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'prompt' && (
                <PromptPanel
                  hasImage={Boolean(currentImageUrl)}
                  onEditWithPrompt={handleEditWithPrompt}
                  onGenerateNew={handleGenerateNew}
                  onEnhancePrompt={(text) => handleEnhancePrompt(text, 'general')}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'adjust' && (
                <AdjustPanel
                  adjustments={adjustments}
                  onChangeAdjustments={setAdjustments}
                  onBakeAdjustments={handleBakeAdjustments}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'crop' && (
                <CropPanel
                  rotation={rotation}
                  flipH={flipH}
                  flipV={flipV}
                  onRotateCw={() => setRotation((prev) => (prev + 90) % 360)}
                  onRotateCcw={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                  onToggleFlipH={() => setFlipH(!flipH)}
                  onToggleFlipV={() => setFlipV(!flipV)}
                  onResetOrientation={() => {
                    setRotation(0);
                    setFlipH(false);
                    setFlipV(false);
                  }}
                  onBakeTransform={handleBakeTransform}
                  onCropAspectRatio={handleCropAspectRatio}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium backdrop-blur-md animate-fade-in bg-neutral-900 border-neutral-700 text-white">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span className="leading-snug">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-neutral-400 hover:text-white p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Export & Sharing Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        sourceImageUrl={currentImageUrl}
        adjustments={adjustments}
        rotation={rotation}
        flipH={flipH}
        flipV={flipV}
      />

      {/* Sample Image Picker Modal */}
      <SampleModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        onSelectSample={(sample) => loadNewImage(sample.url, sample.title)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        history={history}
        currentIndex={historyIndex}
        onSelectStep={handleSelectHistoryStep}
      />

      {/* Quota & AI Architecture Modal */}
      <QuotaModal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        onOpenSamples={() => setSampleModalOpen(true)}
        onTriggerUpload={() => hiddenFileInputRef.current?.click()}
        actionAttempted={quotaDetails.action}
        retryAfterSeconds={quotaDetails.retryAfter}
      />

      {/* Personal Gallery Modal */}
      <PersonalGalleryModal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        photos={photos}
        folders={folders}
        onLoadIntoEditor={handleLoadPhotoFromGallery}
        onOpenSaveModal={() => {
          setGalleryModalOpen(false);
          handleOpenSaveGallery();
        }}
      />

      {/* Save Current Edit to Gallery Modal */}
      {currentImageUrl && (
        <SaveToGalleryModal
          isOpen={saveToGalleryModalOpen}
          onClose={() => setSaveToGalleryModalOpen(false)}
          currentImageUrl={currentImageUrl}
          defaultTitle={history[historyIndex]?.label || 'Studio Creation'}
          presetName={history[historyIndex]?.label}
          category={history[historyIndex]?.category?.toLowerCase()}
          folders={folders}
          onSaved={() => {
            showToast('Saved to your personal cloud gallery!', 'success');
          }}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        onOpenGallery={() => setGalleryModalOpen(true)}
        photoCount={photos.length}
        favoriteCount={photos.filter((p) => p.favorite).length}
        folderCount={folders.length}
      />

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}
