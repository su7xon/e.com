const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_INPUT_MB = 10;
const MAX_SIDE = 1000;
const JPEG_QUALITY = 0.75;

/**
 * Device photo → browser me resize (max 1000px, JPEG) → data URL.
 * Koi server / Firebase / net nahi chahiye. Turant save hota hai.
 * Output ~100-200KB, localStorage + Firestore dono me safe size.
 */
export function processLocalImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Sirf JPG / PNG / WebP / GIF image allowed hai.'));
      return;
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      reject(new Error(`Photo 10MB se chhoti honi chahiye. (milaa ${(file.size / 1024 / 1024).toFixed(1)}MB)`));
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
        if (!ctx) throw new Error('Browser me photo process nahi ho paya.');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objUrl);

        // GIF ko chhod ke sab JPEG me (size chhota). GIF/PNG transparency chahiye to original type rakho.
        const outType = file.type === 'image/gif' ? 'image/gif' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outType, JPEG_QUALITY);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(objUrl);
        reject(e instanceof Error ? e : new Error('Photo process fail ho gaya.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('Ye file photo nahi lag rahi. Dusri image try karo.'));
    };

    img.src = objUrl;
  });
}

/** Data URL hai ya remote link — badge ke liye. */
export function isLocalPhoto(url: string | undefined): boolean {
  return !!url && url.startsWith('data:image');
}
