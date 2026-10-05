import React, { useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Upload,
  Sparkles,
  Eye,
  SplitSquareVertical,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FilterAdjustments, SampleImage } from '../types';
import { getCssFilterString } from '../utils/imageProcessing';

interface CanvasViewportProps {
  currentImageUrl: string | null;
  originalImageUrl: string | null;
  adjustments: FilterAdjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  isProcessing: boolean;
  processingMessage: string;
  compareMode: boolean;
  onToggleCompare: () => void;
  onDropFiles: (files: FileList) => void;
  onSelectSample: (sample: SampleImage) => void;
  sampleImages: SampleImage[];
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  currentImageUrl,
  originalImageUrl,
  adjustments,
  rotation,
  flipH,
  flipV,
  isProcessing,
  processingMessage,
  compareMode,
  onToggleCompare,
  onDropFiles,
  onSelectSample,
  sampleImages,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom and Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Split Comparison Slider (0 to 100 percentage)
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Peek Original state
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false);

  // Drag over state for dropzone
  const [isDragOver, setIsDragOver] = useState(false);

  // Image natural dimensions
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!currentImageUrl) {
      setImageDims(null);
      return;
    }
    const img = new Image();
    img.src = currentImageUrl;
    img.onload = () => {
      setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [currentImageUrl]);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImageUrl]);

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isDraggingSplit) return;
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSplitPos(pct);
      return;
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingSplit(false);
  };

  // Touch support for split slider
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSplit && containerRef.current && e.touches[0]) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSplitPos(pct);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  const cssFilter = getCssFilterString(adjustments);
  const transformStyle = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;

  return (
    <div
      ref={containerRef}
      id="canvas-viewport-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDraggingSplit(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 h-full w-full overflow-hidden select-none bg-neutral-950 flex items-center justify-center p-4 sm:p-6 ${
        zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
    >
      {/* Background pattern grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* When NO image is loaded: Upload & Sample showcase */}
      {!currentImageUrl ? (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center z-10">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/70'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4 text-indigo-400 shadow-inner ring-1 ring-white/10">
              <Upload className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1.5 font-display">
              Upload photo to start editing
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-4">
              Drag & drop any image here, or click to browse. Supports high-res PNG, JPEG, WebP, and AVIF.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors">
                Choose Image File
              </span>
              <span className="text-[11px] text-neutral-500">or press Ctrl+V to paste</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif, image/avif"
              className="hidden"
              onChange={(e) => e.target.files && onDropFiles(e.target.files)}
            />
          </div>

          {/* Sample quick picks */}
          <div className="mt-8 w-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Or try a sample photo
              </span>
              <span className="text-xs text-neutral-500">1-click test</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {sampleImages.map((sample) => (
                <button
                  key={sample.id}
                  id={`sample-card-${sample.id}`}
                  onClick={() => onSelectSample(sample)}
                  className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-neutral-800 hover:border-indigo-500/60 transition-all text-left"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                    <span className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {sample.title}
                    </span>
                    <span className="text-[10px] text-neutral-400">{sample.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Image Display Workspace */
        <div
          className="relative max-w-full max-h-full transition-transform duration-75 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Main Image Container */}
          <div className="relative rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 max-h-[75vh] max-w-[85vw]">
            {/* 1. Comparison Mode: Split View */}
            {compareMode && originalImageUrl ? (
              <div className="relative overflow-hidden select-none">
                {/* Edited image (background) */}
                <img
                  src={currentImageUrl}
                  alt="Edited"
                  referrerPolicy="no-referrer"
                  className="block max-h-[75vh] max-w-[85vw] object-contain"
                  style={{
                    filter: cssFilter,
                    transform: transformStyle,
                  }}
                />

                {/* Original image (clipped by slider) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
                  }}
                >
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    referrerPolicy="no-referrer"
                    className="block max-h-[75vh] max-w-[85vw] object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase text-neutral-300 border border-white/10">
                    Original
                  </div>
                </div>

                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-indigo-950/80 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase text-indigo-300 border border-indigo-500/30">
                  Edited
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-lg"
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingSplit(true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsDraggingSplit(true);
                  }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-xl border border-neutral-300 cursor-ew-resize">
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ) : (
              /* 2. Normal View (with optional Peek Original) */
              <div className="relative">
                <img
                  src={isPeekingOriginal && originalImageUrl ? originalImageUrl : currentImageUrl}
                  alt="Editor Canvas"
                  referrerPolicy="no-referrer"
                  className="block max-h-[75vh] max-w-[85vw] object-contain transition-all"
                  style={{
                    filter: isPeekingOriginal ? 'none' : cssFilter,
                    transform: isPeekingOriginal ? 'none' : transformStyle,
                  }}
                />

                {/* Vignette Overlay Layer if active */}
                {!isPeekingOriginal && adjustments.vignette > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, transparent ${
                        100 - adjustments.vignette * 0.7
                      }%, rgba(0,0,0,${(adjustments.vignette / 100) * 0.85}) 100%)`,
                    }}
                  />
                )}

                {/* Warmth Tint Overlay Layer if active */}
                {!isPeekingOriginal && adjustments.warmth !== 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color"
                    style={{
                      backgroundColor:
                        adjustments.warmth > 0
                          ? `rgba(255, 140, 0, ${(adjustments.warmth / 100) * 0.22})`
                          : `rgba(0, 180, 255, ${(Math.abs(adjustments.warmth) / 100) * 0.22})`,
                    }}
                  />
                )}

                {isPeekingOriginal && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500/90 text-black text-[11px] font-bold uppercase tracking-wider shadow-lg">
                    Viewing Original
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Toolbar: Zoom Controls & Dimensions & Peek */}
      {currentImageUrl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 shadow-xl">
          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1">
            <button
              id="zoom-out-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-neutral-300 w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              id="zoom-in-btn"
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="zoom-fit-btn"
              onClick={handleResetZoom}
              title="Fit to Screen"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-neutral-800" />

          {/* Peek Original button */}
          {originalImageUrl && !compareMode && (
            <button
              id="peek-original-btn"
              onMouseDown={() => setIsPeekingOriginal(true)}
              onMouseUp={() => setIsPeekingOriginal(false)}
              onMouseLeave={() => setIsPeekingOriginal(false)}
              onTouchStart={() => setIsPeekingOriginal(true)}
              onTouchEnd={() => setIsPeekingOriginal(false)}
              title="Hold to temporarily show original photo"
              className="px-2 py-1 rounded-lg text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors flex items-center space-x-1 active:bg-amber-600 active:text-white"
            >
              <Eye className="w-3 h-3" />
              <span>Hold to Peek</span>
            </button>
          )}

          {/* Image Dimensions tag */}
          {imageDims && (
            <div className="hidden sm:block text-[10px] font-mono text-neutral-400 px-1">
              {imageDims.width} × {imageDims.height} px
            </div>
          )}
        </div>
      )}

      {/* Processing / AI Transformation Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 animate-spin flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-neutral-950 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h3 className="text-base font-semibold text-white mb-1.5 font-display">
            AI Magic in Progress
          </h3>
          <p className="text-xs text-neutral-300 max-w-sm mb-3">
            {processingMessage || 'Transforming image with Gemini AI models...'}
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Processing high-fidelity neural filters</span>
          </div>
        </div>
      )}
    </div>
  );
};
