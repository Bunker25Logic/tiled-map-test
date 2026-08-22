/**
 * Loads an image and applies chroma-key transparency if a transparent color is specified.
 * For OTServ/Tibia tilesets, the transparent color is typically #ff00ff (magenta).
 */
export async function loadChromaKeyImage(
  src: string,
  transparentHex?: string
): Promise<HTMLImageElement> {
  const rawImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src} - ${e}`));
    img.src = src;
  });

  if (!transparentHex) {
    return rawImg;
  }

  // Parse hex color e.g. #ff00ff
  const cleanHex = transparentHex.replace('#', '');
  if (cleanHex.length !== 6) return rawImg;

  const targetR = parseInt(cleanHex.substring(0, 2), 16);
  const targetG = parseInt(cleanHex.substring(2, 4), 16);
  const targetB = parseInt(cleanHex.substring(4, 6), 16);

  // Draw to offscreen canvas to process pixel data
  const canvas = document.createElement('canvas');
  canvas.width = rawImg.naturalWidth;
  canvas.height = rawImg.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return rawImg;

  ctx.drawImage(rawImg, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let hasChroma = false;
  // Threshold to account for slight compression/color tolerance if needed
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (Math.abs(r - targetR) <= 8 && Math.abs(g - targetG) <= 8 && Math.abs(b - targetB) <= 8) {
      data[i + 3] = 0; // set alpha to 0
      hasChroma = true;
    }
  }

  if (hasChroma) {
    ctx.putImageData(imgData, 0, 0);
    const transparentImg = new Image();
    transparentImg.src = canvas.toDataURL('image/png');
    await new Promise<void>((resolve) => {
      transparentImg.onload = () => resolve();
    });
    return transparentImg;
  }

  return rawImg;
}
