const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_INPUT_MB = 10;
const TARGET_KB = 300;
const MIN_KB = 200;
const START_MAX_SIDE = 1280;
const MIN_SIDE = 640;

export interface OptimizedImage {
  blob: Blob;
  sizeKB: number;
  width: number;
  height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('Ye file photo nahi lag rahi. Dusri image try karo.'));
    };
    img.src = objUrl;
  });
}

function canvasToBlob(
  img: HTMLImageElement,
  side: number,
  quality: number,
  type: string
): Promise<Blob> {
  const scale = Math.min(1, side / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser me photo process nahi ho paya.');
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Photo compress fail ho gaya.'))),
      type,
      quality
    );
  });
}

/**
 * Photo ko 200-300KB band me optimize karo.
 * GIF: resize only (animation bachani ho to). Baaki: JPEG quality loop.
 * Returns compressed Blob + final size. Original file haath nahi lagata.
 */
export async function optimizeImage(
  file: File,
  onStep?: (label: string) => void
): Promise<OptimizedImage> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Sirf JPG / PNG / WebP / GIF image allowed hai.');
  }
  if (file.size > MAX_INPUT_MB * 1024 * 1024) {
    throw new Error(`Photo 10MB se chhoti honi chahiye. (milaa ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  // Pehle se 200-300KB ke andar → seedha use karo, quality loss nahi
  const kb = file.size / 1024;
  if (kb >= MIN_KB && kb <= TARGET_KB) {
    return { blob: file, sizeKB: Math.round(kb), width: 0, height: 0 };
  }

  onStep?.('Photo chhoti kar rahe...');
  const img = await loadImage(file);

  // GIF: sirf resize, dubara encode mat karo (animation toot jaati)
  if (file.type === 'image/gif') {
    const blob = await canvasToBlob(img, START_MAX_SIDE, 1, 'image/gif');
    return { blob, sizeKB: Math.round(blob.size / 1024), width: img.width, height: img.height };
  }

  const type = 'image/jpeg';
  let side = Math.min(START_MAX_SIDE, Math.max(img.width, img.height));
  let quality = kb < MIN_KB ? 0.85 : 0.8;
  let best: Blob | null = null;

  // Quality loop: 300KB se neeche lao, 200KB ke aas-paas best rakho
  for (let i = 0; i < 8; i++) {
    const blob = await canvasToBlob(img, side, quality, type);
    const sizeKB = blob.size / 1024;
    if (sizeKB <= TARGET_KB && sizeKB >= MIN_KB) {
      return { blob, sizeKB: Math.round(sizeKB), width: img.width, height: img.height };
    }
    if (sizeKB <= TARGET_KB) {
      best = blob; // 200 se neeche par acceptable — aur compress mat karo
      break;
    }
    best = blob;
    quality -= 0.1;
    if (quality < 0.4) {
      quality = 0.6;
      side = Math.max(MIN_SIDE, Math.round(side * 0.8));
      if (side <= MIN_SIDE && best && best.size / 1024 <= TARGET_KB + 100) break;
    }
  }

  const final = best ?? (await canvasToBlob(img, MIN_SIDE, 0.6, type));
  return { blob: final, sizeKB: Math.round(final.size / 1024), width: img.width, height: img.height };
}

/** Blob → data URL (Firestore doc me seedha save hota hai, 1MB doc limit ke andar). */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Photo ready nahi ho payi.'));
    reader.readAsDataURL(blob);
  });
}
