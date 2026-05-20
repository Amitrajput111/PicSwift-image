/**
 * Helper to load an image file into an HTMLImageElement.
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Compresses an image to fit a target file size in Kilobytes.
 * Uses a binary search algorithm over the Canvas quality parameter (0.01 to 1.0).
 */
export async function compressToTargetSize(
  file: File,
  targetSizeKB: number,
  format: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg'
): Promise<{ blob: Blob; quality: number; sizeKB: number }> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  // Set standard dimensions (downscale slightly if huge to avoid browser crash/out-of-memory)
  const maxDimension = 3000;
  let width = img.width;
  let height = img.height;
  
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  // If PNG format is requested, PNG uses lossless compression in Canvas, 
  // so quality parameter does not affect file size. If they need target-size PNG,
  // we have to adjust resolution (width/height dimensions) instead of compression quality.
  if (format === 'image/png') {
    return compressPngByDimension(canvas, targetSizeKB);
  }

  const targetSizeBytes = targetSizeKB * 1024;
  
  // Binary Search Quality Loop
  let low = 0.01;
  let high = 0.99;
  let bestBlob: Blob | null = null;
  let bestQuality = 0.5;
  let iterations = 0;
  const maxIterations = 8; // log2(100) ≈ 7 iterations is enough for 1% precision

  while (low <= high && iterations < maxIterations) {
    const mid = (low + high) / 2;
    const blob = await canvasToBlob(canvas, format, mid);
    
    if (!blob) break;

    const currentSize = blob.size;

    if (currentSize <= targetSizeBytes) {
      // It fits! Record it and try to get better quality
      bestBlob = blob;
      bestQuality = mid;
      low = mid + 0.01;
    } else {
      // Too large! Reduce quality
      high = mid - 0.01;
      // In case we can't find anything smaller, store the smallest one we got
      if (!bestBlob || currentSize < bestBlob.size) {
        bestBlob = blob;
        bestQuality = mid;
      }
    }
    iterations++;
  }

  // If even at 0.01 quality it's too large, we must downscale dimensions
  if (bestBlob && bestBlob.size > targetSizeBytes) {
    return downscaleAndCompress(canvas, targetSizeKB, format);
  }

  const finalBlob = bestBlob || await canvasToBlob(canvas, format, 0.1) as Blob;

  return {
    blob: finalBlob,
    quality: Math.round(bestQuality * 100),
    sizeKB: Number((finalBlob.size / 1024).toFixed(2))
  };
}

/**
 * Helper to convert canvas to blob with specific format & quality.
 */
function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}

/**
 * Fallback to scale down dimensions for images that are still too large at minimum quality.
 */
async function downscaleAndCompress(
  canvas: HTMLCanvasElement,
  targetSizeKB: number,
  format: 'image/jpeg' | 'image/webp'
): Promise<{ blob: Blob; quality: number; sizeKB: number }> {
  let scale = 0.9;
  let finalBlob: Blob | null = null;
  const targetSizeBytes = targetSizeKB * 1024;
  
  while (scale > 0.1) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(canvas.width * scale);
    tempCanvas.height = Math.round(canvas.height * scale);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) break;

    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    const blob = await canvasToBlob(tempCanvas, format, 0.15); // low-mid quality

    if (blob) {
      finalBlob = blob;
      if (blob.size <= targetSizeBytes) {
        break;
      }
    }
    scale -= 0.15;
  }

  const resultBlob = finalBlob || await canvasToBlob(canvas, format, 0.05) as Blob;

  return {
    blob: resultBlob,
    quality: 5,
    sizeKB: Number((resultBlob.size / 1024).toFixed(2))
  };
}

/**
 * Since PNG is lossless, we compress by adjusting resolution scale.
 */
async function compressPngByDimension(
  canvas: HTMLCanvasElement,
  targetSizeKB: number
): Promise<{ blob: Blob; quality: number; sizeKB: number }> {
  const targetSizeBytes = targetSizeKB * 1024;
  
  let low = 0.1;
  let high = 1.0;
  let bestBlob: Blob | null = null;
  let bestScale = 1.0;
  let iterations = 0;
  const maxIterations = 7;

  while (low <= high && iterations < maxIterations) {
    const mid = (low + high) / 2;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(canvas.width * mid);
    tempCanvas.height = Math.round(canvas.height * mid);
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      const blob = await canvasToBlob(tempCanvas, 'image/png', 1.0);
      if (blob) {
        if (blob.size <= targetSizeBytes) {
          bestBlob = blob;
          bestScale = mid;
          low = mid + 0.05; // Try larger resolution
        } else {
          high = mid - 0.05; // Make resolution smaller
          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob;
            bestScale = mid;
          }
        }
      }
    }
    iterations++;
  }

  const finalBlob = bestBlob || await canvasToBlob(canvas, 'image/png', 1.0) as Blob;

  return {
    blob: finalBlob,
    quality: Math.round(bestScale * 100), // In PNG, quality represents the resolution scale %
    sizeKB: Number((finalBlob.size / 1024).toFixed(2))
  };
}
