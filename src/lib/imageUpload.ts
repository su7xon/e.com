const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_INPUT_MB = 10;
const MAX_SIDE = 1000;
const JPEG_QUALITY = 0.75;

/**
 * Device photo → resized in browser (max 1000px, JPEG) → data URL.
 * No server / Firebase / network needed. Saves instantly.
 * Output ~100-200KB, safe size for both localStorage + Firestore.
 */
export function processLocalImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Only JPG / PNG / WebP / GIF images are allowed.'));
      return;
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      reject(new Error(`Photo must be smaller than 10MB. (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`));
      return;
    }

    const objUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not process the photo in the browser.');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objUrl);

        // Everything except GIF goes to JPEG (smaller size). Keep original type if GIF/PNG transparency is needed.
        const outType = file.type === 'image/gif' ? 'image/gif' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outType, JPEG_QUALITY);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(objUrl);
        reject(e instanceof Error ? e : new Error('Photo processing failed.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('This file does not look like a photo. Please try a different image.'));
    };

    img.src = objUrl;
  });
}

/** Whether it is a data URL or a remote link — used for the badge. */
export function isLocalPhoto(url: string | undefined): boolean {
  return !!url && url.startsWith('data:image');
}
