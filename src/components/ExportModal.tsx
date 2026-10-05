import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Share2,
  Check,
  Sparkles,
  Layers,
  FileImage,
  Maximize,
  ShieldCheck,
} from 'lucide-react';
import { ExportSettings, FilterAdjustments } from '../types';
import {
  exportHighResolutionImage,
  copyImageBlobToClipboard,
  shareImageFile,
  formatBytes,
} from '../utils/imageProcessing';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImageUrl: string | null;
  adjustments: FilterAdjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sourceImageUrl,
  adjustments,
  rotation,
  flipH,
  flipV,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(0.92);
  const [scale, setScale] = useState<1 | 1.5 | 2>(1);
  const [filename, setFilename] = useState<string>('ai-photo-creation');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Load natural dimensions & estimate file size
  useEffect(() => {
    if (!isOpen || !sourceImageUrl) return;

    let isMounted = true;
    const updateEstimates = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = sourceImageUrl;
        await img.decode();

        const isRotated = Math.abs(rotation % 180) === 90;
        const w = Math.round((isRotated ? img.naturalHeight : img.naturalWidth) * scale);
        const h = Math.round((isRotated ? img.naturalWidth : img.naturalHeight) * scale);

        if (isMounted) {
          setDimensions({ width: w, height: h });
        }

        // Quick low-overhead estimate
        const res = await exportHighResolutionImage(
          img,
          adjustments,
          rotation,
          flipH,
          flipV,
          {
            format,
            quality,
            scale,
            filename: `${filename}.${format}`,
          }
        );

        if (isMounted) {
          setEstimatedSize(res.sizeBytes);
        }
      } catch (err) {
        console.warn('Estimate export error:', err);
      }
    };

    updateEstimates();
    return () => {
      isMounted = false;
    };
  }, [isOpen, sourceImageUrl, format, quality, scale, rotation, flipH, flipV]);

  if (!isOpen || !sourceImageUrl) return null;

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceImageUrl;
      await img.decode();

      const result = await exportHighResolutionImage(
        img,
        adjustments,
        rotation,
        flipH,
        flipV,
        {
          format,
          quality,
          scale,
          filename: `${filename}.${format}`,
        }
      );

      // Trigger standard browser download
      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = `${filename || 'ai-edited-photo'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      setIsExporting(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceImageUrl;
      await img.decode();

      const result = await exportHighResolutionImage(
        img,
        adjustments,
        rotation,
        flipH,
        flipV,
        {
          format: 'png', // Clipboard universally requires PNG
          quality: 1.0,
          scale,
          filename: `${filename}.png`,
        }
      );

      const success = await copyImageBlobToClipboard(result.blob);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsExporting(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceImageUrl;
      await img.decode();

      const result = await exportHighResolutionImage(
        img,
        adjustments,
        rotation,
        flipH,
        flipV,
        {
          format,
          quality,
          scale,
          filename: `${filename}.${format}`,
        }
      );

      const shared = await shareImageFile(
        result.blob,
        `${filename}.${format}`,
        'AI Photo Studio Export'
      );
      if (shared) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Native share failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Export & Share</h2>
              <p className="text-xs text-neutral-400">High-resolution PNG, JPEG, and WebP formats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Format Choice */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'png', name: 'PNG', badge: 'Lossless', desc: 'Best for maximum clarity & graphics' },
                { id: 'jpeg', name: 'JPEG', badge: 'Universal', desc: 'Standard photo format, small size' },
                { id: 'webp', name: 'WebP', badge: 'Modern', desc: 'Cutting-edge compression' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  id={`export-format-${fmt.id}`}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === fmt.id
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{fmt.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (JPEG & WebP) */}
          {format !== 'png' && (
            <div className="space-y-2 bg-neutral-950/50 p-3.5 rounded-xl border border-neutral-800/80">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-300">Image Quality</span>
                <span className="text-indigo-400 font-mono font-semibold">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.0"
                step="0.02"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Smaller file (60%)</span>
                <span>Balanced (80%)</span>
                <span>Maximum (100%)</span>
              </div>
            </div>
          )}

          {/* Scale / Upscale Resolution */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
              Export Resolution & Scaling
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { s: 1, label: '1x Original', sub: 'Native resolution' },
                { s: 1.5, label: '1.5x HD', sub: 'High Definition' },
                { s: 2, label: '2x Ultra HD', sub: 'Super-Resolution' },
              ].map((item) => (
                <button
                  key={item.s}
                  type="button"
                  id={`export-scale-${item.s}x`}
                  onClick={() => setScale(item.s as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    scale === item.s
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800/60'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filename input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
              File Name
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-l-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <span className="bg-neutral-800 border border-l-0 border-neutral-700 rounded-r-xl px-3 py-2 text-xs font-mono text-neutral-400">
                .{format}
              </span>
            </div>
          </div>

          {/* Export Details Bar */}
          <div className="bg-neutral-950/70 rounded-xl p-3 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Maximize className="w-4 h-4 text-indigo-400" />
              <span className="text-neutral-300">
                {dimensions ? `${dimensions.width} × ${dimensions.height} px` : 'Calculating...'}
              </span>
            </div>
            <div className="text-neutral-400 font-mono">
              Estimated: <span className="text-white font-semibold">{estimatedSize ? formatBytes(estimatedSize) : 'Calculating...'}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Copy to Clipboard */}
          <button
            type="button"
            id="export-copy-clipboard-btn"
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          {/* Web Share (if supported) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              id="export-share-btn"
              onClick={handleNativeShare}
              disabled={isExporting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Shared!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}

          {/* Primary Download Button */}
          <button
            type="button"
            id="export-download-btn"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full sm:flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
