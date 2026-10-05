import { FilterAdjustments, ExportSettings } from '../types';

/**
 * Safely loads an image URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`));
    img.src = src;
  });
}

/**
 * Formats file size in human-readable units
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Builds CSS filter string from FilterAdjustments
 */
export function getCssFilterString(adj: FilterAdjustments): string {
  const parts: string[] = [];

  // Brightness: -100 to 100 -> 0% to 200% (default 100%)
  const bVal = 100 + adj.brightness + adj.exposure * 0.8;
  parts.push(`brightness(${Math.max(0, bVal)}%)`);

  // Contrast: -100 to 100 -> 0% to 200% (default 100%)
  const cVal = 100 + adj.contrast;
  parts.push(`contrast(${Math.max(0, cVal)}%)`);

  // Saturation: -100 to 100 -> 0% to 200% (default 100%)
  const sVal = adj.grayscale ? 0 : Math.max(0, 100 + adj.saturation);
  parts.push(`saturate(${sVal}%)`);

  // Sepia: 0 to 100%
  if (adj.sepia > 0) {
    parts.push(`sepia(${adj.sepia}%)`);
  }

  // Invert
  if (adj.invert) {
    parts.push(`invert(100%)`);
  }

  // Blur: 0 to 20px
  if (adj.blur > 0) {
    parts.push(`blur(${adj.blur}px)`);
  }

  return parts.join(' ');
}

/**
 * Applies full adjustments (CSS filters + Warmth + Vignette + Sharpness) onto a Canvas
 */
export async function renderProcessedCanvas(
  sourceImage: HTMLImageElement,
  adjustments: FilterAdjustments,
  rotation = 0,
  flipH = false,
  flipV = false,
  targetWidth?: number,
  targetHeight?: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain 2D canvas context');

  // Determine canvas dimensions based on rotation
  const isRotated90or270 = Math.abs(rotation % 180) === 90;
  const naturalW = sourceImage.naturalWidth || sourceImage.width;
  const naturalH = sourceImage.naturalHeight || sourceImage.height;

  const baseW = isRotated90or270 ? naturalH : naturalW;
  const baseH = isRotated90or270 ? naturalW : naturalH;

  const outW = targetWidth || baseW;
  const outH = targetHeight || baseH;

  canvas.width = Math.round(outW);
  canvas.height = Math.round(outH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply Transform (Rotation & Flip)
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Apply CSS Filter string directly to canvas context
  ctx.filter = getCssFilterString(adjustments);

  // Draw source image centered
  const drawW = isRotated90or270 ? canvas.height : canvas.width;
  const drawH = isRotated90or270 ? canvas.width : canvas.height;
  ctx.drawImage(sourceImage, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();

  // Reset filter for subsequent compositing layers
  ctx.filter = 'none';

  // 1. Apply Temperature / Warmth tint overlay
  if (adjustments.warmth !== 0) {
    ctx.save();
    if (adjustments.warmth > 0) {
      // Warm Amber tint
      ctx.fillStyle = `rgba(255, 140, 0, ${(adjustments.warmth / 100) * 0.22})`;
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Cool Cyan/Blue tint
      ctx.fillStyle = `rgba(0, 180, 255, ${(Math.abs(adjustments.warmth) / 100) * 0.22})`;
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  // 2. Apply Vignette radial overlay
  if (adjustments.vignette > 0) {
    ctx.save();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outerRadius = Math.sqrt(cx * cx + cy * cy);
    const innerRadius = outerRadius * (1 - (adjustments.vignette / 100) * 0.5);

    const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    const maxAlpha = (adjustments.vignette / 100) * 0.85;
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${maxAlpha})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 3. Apply Sharpness convolution kernel if requested
  if (adjustments.sharpness > 0) {
    applySharpness(ctx, canvas.width, canvas.height, adjustments.sharpness);
  }

  return canvas;
}

/**
 * 3x3 unsharp mask / convolution filter for image sharpening
 */
function applySharpness(ctx: CanvasRenderingContext2D, w: number, h: number, sharpness: number) {
  try {
    const factor = (sharpness / 100) * 0.8;
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = imgData.data;
    const output = ctx.createImageData(w, h);
    const dst = output.data;

    // Kernel:
    //  0, -f,  0
    // -f, 1+4f, -f
    //  0, -f,  0
    const center = 1 + 4 * factor;
    const edge = -factor;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        const iUp = ((y - 1) * w + x) * 4;
        const iDown = ((y + 1) * w + x) * 4;
        const iLeft = (y * w + (x - 1)) * 4;
        const iRight = (y * w + (x + 1)) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            src[i + c] * center +
            (src[iUp + c] + src[iDown + c] + src[iLeft + c] + src[iRight + c]) * edge;
          dst[i + c] = Math.min(255, Math.max(0, val));
        }
        dst[i + 3] = src[i + 3]; // Alpha
      }
    }

    // Preserve border pixels
    for (let x = 0; x < w; x++) {
      const top = x * 4;
      const bottom = ((h - 1) * w + x) * 4;
      for (let c = 0; c < 4; c++) {
        dst[top + c] = src[top + c];
        dst[bottom + c] = src[bottom + c];
      }
    }
    for (let y = 0; y < h; y++) {
      const left = (y * w) * 4;
      const right = (y * w + (w - 1)) * 4;
      for (let c = 0; c < 4; c++) {
        dst[left + c] = src[left + c];
        dst[right + c] = src[right + c];
      }
    }

    ctx.putImageData(output, 0, 0);
  } catch (e) {
    console.warn('Canvas sharpness convolution skipped:', e);
  }
}

/**
 * Generates high resolution exported Blob & DataURL based on export settings
 */
export async function exportHighResolutionImage(
  sourceImage: HTMLImageElement,
  adjustments: FilterAdjustments,
  rotation = 0,
  flipH = false,
  flipV = false,
  settings: ExportSettings
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; sizeBytes: number }> {
  const isRotated = Math.abs(rotation % 180) === 90;
  const baseW = isRotated ? sourceImage.naturalHeight : sourceImage.naturalWidth;
  const baseH = isRotated ? sourceImage.naturalWidth : sourceImage.naturalHeight;

  let targetW = Math.round(baseW * settings.scale);
  let targetH = Math.round(baseH * settings.scale);

  if (settings.customWidth && settings.customHeight) {
    targetW = settings.customWidth;
    targetH = settings.customHeight;
  }

  const canvas = await renderProcessedCanvas(
    sourceImage,
    adjustments,
    rotation,
    flipH,
    flipV,
    targetW,
    targetH
  );

  let mimeType = 'image/png';
  if (settings.format === 'jpeg') mimeType = 'image/jpeg';
  else if (settings.format === 'webp') mimeType = 'image/webp';

  const quality = settings.format === 'png' ? 1.0 : settings.quality;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error('Failed to create image blob'));
        }
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({
          blob,
          dataUrl,
          width: targetW,
          height: targetH,
          sizeBytes: blob.size,
        });
      },
      mimeType,
      quality
    );
  });
}

/**
 * Copies a PNG blob directly to the system clipboard
 */
export async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      return false;
    }
    // Clipboard item requires image/png
    let pngBlob = blob;
    if (blob.type !== 'image/png') {
      // Convert to PNG for clipboard compatibility
      const img = await loadImage(URL.createObjectURL(blob));
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    }

    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Native Web Share API trigger
 */
export async function shareImageFile(blob: Blob, filename: string, title = 'Edited Photo'): Promise<boolean> {
  try {
    if (!navigator.share) return false;
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      return false;
    }
    await navigator.share({
      title,
      files: [file],
    });
    return true;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('Web Share failed:', err);
    }
    return false;
  }
}

/**
 * Converts File or Blob to Base64 data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Client-Side Instant Neural Filter Engine
 * Applies stylized aesthetics directly on Canvas when AI cloud is offline or user desires instant preview
 */
export async function applyClientStyleFilter(
  sourceImage: HTMLImageElement,
  styleId: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceImage.src;

  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(sourceImage, 0, 0);

  if (styleId === 'cyberpunk') {
    // Magenta and Cyan duotone neon overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(217, 70, 239, 0.45)'); // Magenta
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.5)');   // Cyan
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 20);
  } else if (styleId === 'vintage-70s') {
    // Warm retro amber wash + sepia + subtle vignette
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // Warm vintage vignette
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.sqrt(cx * cx + cy * cy);
    const vignette = ctx.createRadialGradient(cx, cy, rad * 0.45, cx, cy, rad);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(60,25,5,0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (styleId === 'gothic-noir') {
    // High contrast black and white with deep shadows
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // High contrast S-curve
      const c = avg < 128 ? (avg * avg) / 128 : 255 - ((255 - avg) * (255 - avg)) / 128;
      d[i] = c;
      d[i + 1] = c;
      d[i + 2] = c;
    }
    ctx.putImageData(imgData, 0, 0);
    applySharpness(ctx, w, h, 25);
  } else if (styleId === 'cinematic-teal') {
    // Teal in shadows, orange in highlights
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.45)'); // Orange top
    grad.addColorStop(1, 'rgba(13, 148, 136, 0.55)'); // Teal bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (styleId === 'anime-ghibli') {
    // Vibrant watercolor anime: boosted emerald greens & sky blues with soft ambient daylight
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.18)'); // Sky blue
    grad.addColorStop(1, 'rgba(52, 211, 153, 0.22)'); // Emerald
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // Micro-outline sharpness
    applySharpness(ctx, w, h, 22);
  } else if (styleId === 'renaissance-oil') {
    // Rich Caravaggio oil painting: warm deep umber tones, rich golden highlights, dramatic chiaroscuro
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(120, 53, 15, 0.25)'; // Deep amber umber
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(217, 119, 6, 0.25)'; // Golden glaze
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (styleId === 'editorial-vogue') {
    // High-fashion magazine monochrome / desaturated silver with sculpted studio strobe lighting
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Desaturate 75% towards editorial tone
      d[i] = d[i] * 0.25 + avg * 0.75;
      d[i + 1] = d[i + 1] * 0.25 + avg * 0.75;
      d[i + 2] = d[i + 2] * 0.25 + avg * 0.75;
    }
    ctx.putImageData(imgData, 0, 0);
    applySharpness(ctx, w, h, 35);
  } else if (styleId === 'pop-art') {
    // Warhol / Lichtenstein pop art color posterization
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Quantize colors into bold pop-art bands
      d[i] = Math.round(d[i] / 64) * 64;
      d[i + 1] = Math.round(d[i + 1] / 64) * 64;
      d[i + 2] = Math.round(d[i + 2] / 64) * 64;
    }
    ctx.putImageData(imgData, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)'; // Pop Magenta
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (styleId === 'pixar-3d') {
    // Subsurface scattering warmth & 3D ambient glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(251, 146, 60, 0.15)'; // Soft peach glow
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 18);
  } else if (styleId === 'modern-watercolor') {
    // Dreamy translucent watercolor wash
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(244, 63, 94, 0.35)');  // Rose
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.35)'); // Lavender
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (styleId === 'claymation') {
    // Tactile plasticine warmth and matte contrast
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(234, 88, 12, 0.2)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (styleId === 'minimalist-pastel') {
    // Airy Scandinavian pastel daylight
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(254, 243, 199, 0.2)'; // Warm cream
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Client-Side Fashion Styling Filter Engine
 */
export async function applyClientFashionFilter(
  sourceImage: HTMLImageElement,
  fashionId: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceImage.src;

  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(sourceImage, 0, 0);

  if (fashionId === 'runway-couture') {
    // Sculpted Paris runway contrast + metallic bronze/gold highlights
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.3)');   // Gold
    grad.addColorStop(1, 'rgba(24, 24, 27, 0.45)');  // Obsidian
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 30);
  } else if (fashionId === 'tokyo-techwear') {
    // Matte tactical slate + glowing electric cyan seam accents
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = 'rgba(71, 85, 105, 0.35)'; // Cool slate
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.18)'; // Cyan techwear glow
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 28);
  } else if (fashionId === 'vintage-glamour-50s') {
    // 1950s Old Hollywood velvet & champagne glamour
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(253, 230, 138, 0.25)'; // Champagne
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // Soft glamour vignette
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.sqrt(cx * cx + cy * cy);
    const vignette = ctx.createRadialGradient(cx, cy, rad * 0.4, cx, cy, rad);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(15, 23, 42, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (fashionId === 'luxury-streetwear') {
    // Milan streetwear: warm distressed leather tones & punchy contrast
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 25);
  } else if (fashionId === 'royal-baroque') {
    // Crimson velvet & gold bullion filigree
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(153, 27, 27, 0.22)'; // Deep crimson
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)'; // Gold highlights
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (fashionId === 'boho-linen') {
    // Mediterranean summer linen: natural beige tones & warm coastal sunlight
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (fashionId === 'bespoke-suit') {
    // Savile Row Italian tailoring: charcoal fine-wool with crisp white shirt contrast
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i] * 0.4 + avg * 0.6;
      d[i + 1] = d[i + 1] * 0.4 + avg * 0.6;
      d[i + 2] = d[i + 2] * 0.4 + avg * 0.6;
    }
    ctx.putImageData(imgData, 0, 0);
    applySharpness(ctx, w, h, 32);
  } else if (fashionId === 'cyber-armor') {
    // Futuristic cybernetic exo-suit: matte carbon composite with cyan energy seams
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 35);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Client-Side Image Enhancement Filter Engine
 */
export async function applyClientEnhanceFilter(
  sourceImage: HTMLImageElement,
  enhanceId: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceImage.src;

  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(sourceImage, 0, 0);

  if (enhanceId === 'studio-portrait') {
    // Balanced 3-point studio lighting & skin texture micro-smoothing
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255, 237, 213, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 18);
  } else if (enhanceId === 'golden-hour') {
    // Radiant golden sunset flare & warm rim lighting
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(251, 146, 60, 0.28)'); // Amber
    grad.addColorStop(1, 'rgba(245, 158, 11, 0.18)'); // Gold
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (enhanceId === 'hdr-clarity') {
    // HDR dynamic range recovery: lift shadows & enhance micro-contrast
    applySharpness(ctx, w, h, 35);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (enhanceId === 'low-light-recovery') {
    // Night & low light illumination recovery
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    applySharpness(ctx, w, h, 15);
  } else if (enhanceId === 'bokeh-depth') {
    // Portrait bokeh & optical separation: sharp center with peripheral vignette
    applySharpness(ctx, w, h, 20);
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.sqrt(cx * cx + cy * cy);
    const vignette = ctx.createRadialGradient(cx, cy, rad * 0.45, cx, cy, rad);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (enhanceId === 'ultra-remaster') {
    // 8K Ultra remastering: high pass micro-contrast & optical clarity
    applySharpness(ctx, w, h, 40);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Client-Side Semantic Prompt Interpreter
 * Maps freeform user prompts to stylized aesthetic passes on device
 */
export async function applyClientPromptFilter(
  sourceImage: HTMLImageElement,
  promptText: string
): Promise<string> {
  const p = promptText.toLowerCase();

  if (p.includes('vintage') || p.includes('retro') || p.includes('film') || p.includes('70s') || p.includes('polaroid')) {
    return applyClientStyleFilter(sourceImage, 'vintage-70s');
  }
  if (p.includes('cyberpunk') || p.includes('neon') || p.includes('futuristic') || p.includes('sci-fi')) {
    return applyClientStyleFilter(sourceImage, 'cyberpunk');
  }
  if (p.includes('noir') || p.includes('black and white') || p.includes('monochrome') || p.includes('dark')) {
    return applyClientStyleFilter(sourceImage, 'gothic-noir');
  }
  if (p.includes('anime') || p.includes('ghibli') || p.includes('manga') || p.includes('cartoon')) {
    return applyClientStyleFilter(sourceImage, 'anime-ghibli');
  }
  if (p.includes('oil') || p.includes('painting') || p.includes('renaissance') || p.includes('artistic')) {
    return applyClientStyleFilter(sourceImage, 'renaissance-oil');
  }
  if (p.includes('fashion') || p.includes('vogue') || p.includes('editorial') || p.includes('model')) {
    return applyClientStyleFilter(sourceImage, 'editorial-vogue');
  }
  if (p.includes('golden') || p.includes('sunset') || p.includes('warm') || p.includes('sun')) {
    return applyClientEnhanceFilter(sourceImage, 'golden-hour');
  }
  if (p.includes('hdr') || p.includes('sharp') || p.includes('detail') || p.includes('clarity')) {
    return applyClientEnhanceFilter(sourceImage, 'hdr-clarity');
  }
  if (p.includes('suit') || p.includes('tuxedo') || p.includes('formal') || p.includes('executive')) {
    return applyClientFashionFilter(sourceImage, 'bespoke-suit');
  }
  if (p.includes('couture') || p.includes('runway') || p.includes('dress') || p.includes('gown')) {
    return applyClientFashionFilter(sourceImage, 'runway-couture');
  }

  // Default clean studio enhancement
  return applyClientEnhanceFilter(sourceImage, 'studio-portrait');
}
