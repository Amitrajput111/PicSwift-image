import * as ort from 'onnxruntime-web';

// Initialize the WASM path for ONNX Runtime.
// Match the exact version in package.json (1.26.0) to prevent version mismatch loading crashes.
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/';

const CACHE_NAME = 'clarity-ai-models';
// Direct download link to the official, public onnx-community quantized MODNet matting model (approx. 6.3MB)
const MODEL_URL = 'https://huggingface.co/onnx-community/modnet-webnn/resolve/main/onnx/model_quantized.onnx';

/**
 * Downloads and caches the ONNX model using Cache Storage API, returns model ArrayBuffer.
 */
export async function getModelBuffer(
  onProgress: (percent: number) => void
): Promise<ArrayBuffer> {
  if (!('caches' in window)) {
    // Fallback if Cache Storage API is not available
    const response = await fetchWithProgress(MODEL_URL, onProgress);
    return await response.arrayBuffer();
  }

  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(MODEL_URL);

  if (cachedResponse) {
    onProgress(100);
    return await cachedResponse.arrayBuffer();
  }

  // Fetch model with download progress feedback
  const response = await fetchWithProgress(MODEL_URL, onProgress);
  
  // Clone response before consuming it to store it in cache
  const responseClone = response.clone();
  await cache.put(MODEL_URL, responseClone);
  
  return await response.arrayBuffer();
}

/**
 * Helper to fetch file with progress updates.
 */
async function fetchWithProgress(url: string, onProgress: (percent: number) => void): Promise<Response> {
  const response = await fetch(url);
  
  if (!response.body) {
    throw new Error('ReadableStream not supported on response body');
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

  if (totalBytes === 0) {
    onProgress(50); // Muted progress fallback
    return response;
  }

  let receivedBytes = 0;
  const reader = response.body.getReader();
  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          break;
        }
        receivedBytes += value.byteLength;
        onProgress(Math.round((receivedBytes / totalBytes) * 100));
        controller.enqueue(value);
      }
    }
  });

  return new Response(stream, { headers: response.headers });
}

/**
 * Creates an ONNX Inference Session using the pre-cached model buffer.
 */
let sessionInstance: ort.InferenceSession | null = null;
export async function loadModel(
  onProgress: (percent: number) => void
): Promise<ort.InferenceSession> {
  if (sessionInstance) {
    onProgress(100);
    return sessionInstance;
  }

  const modelBuffer = await getModelBuffer(onProgress);
  // Create Inference Session in WebAssembly environment
  sessionInstance = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all'
  });
  return sessionInstance;
}

/**
 * Preprocesses an image to fit the 512x512 network shape requirement.
 * Normalizes input pixels using MODNet mean (0.5) and std (0.5) resulting in a [-1, 1] range.
 */
function preprocess(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ort.Tensor {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data; // RGBA array of size 512*512*4

  // Float array for CHW format: [1, 3, 512, 512]
  const rFloat = new Float32Array(width * height);
  const gFloat = new Float32Array(width * height);
  const bFloat = new Float32Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    // Normalize to [-1, 1] range: (pixel / 255.0 - 0.5) / 0.5 = (pixel / 127.5) - 1.0
    rFloat[pixelIndex] = (data[i] / 127.5) - 1.0;
    gFloat[pixelIndex] = (data[i + 1] / 127.5) - 1.0;
    bFloat[pixelIndex] = (data[i + 2] / 127.5) - 1.0;
  }

  // Combine CHW channels
  const combined = new Float32Array(3 * width * height);
  combined.set(rFloat, 0);
  combined.set(gFloat, width * height);
  combined.set(bFloat, 2 * width * height);

  return new ort.Tensor('float32', combined, [1, 3, width, height]);
}


/**
 * Runs the AI background removal.
 * 1. Resizes input image to 512x512.
 * 2. Feeds image tensor to MODNet.
 * 3. Extracts alpha mask and resizes it back to original dimensions.
 * 4. Merges alpha mask with original image data onto a Canvas.
 */
export async function removeBackground(
  imageElement: HTMLImageElement,
  onProgress: (percent: number) => void
): Promise<Blob> {
  // Load model
  const session = await loadModel(onProgress);

  const inputDim = 512;
  const originalWidth = imageElement.width;
  const originalHeight = imageElement.height;

  // 1. Create a helper canvas to draw the 512x512 scaled image
  const prepCanvas = document.createElement('canvas');
  prepCanvas.width = inputDim;
  prepCanvas.height = inputDim;
  const prepCtx = prepCanvas.getContext('2d');
  
  if (!prepCtx) {
    throw new Error('Could not create preprocessing canvas context');
  }

  prepCtx.drawImage(imageElement, 0, 0, inputDim, inputDim);
  const inputTensor = preprocess(prepCtx, inputDim, inputDim);

  // 2. Run inference
  const inputs: Record<string, ort.Tensor> = {};
  inputs[session.inputNames[0]] = inputTensor;
  
  const outputs = await session.run(inputs);
  const outputTensor = outputs[session.outputNames[0]];
  const outputData = outputTensor.data as Float32Array; // Array size 512 * 512 = 262,144 values (0 to 1)

  // 3. Create canvas for the original image
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = originalWidth;
  finalCanvas.height = originalHeight;
  const finalCtx = finalCanvas.getContext('2d');
  
  if (!finalCtx) {
    throw new Error('Could not create output canvas context');
  }

  // Draw original image
  finalCtx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);
  const originalImgData = finalCtx.getImageData(0, 0, originalWidth, originalHeight);
  const pixels = originalImgData.data;

  // 4. Create an alpha-mask canvas to resize the 512x512 model output mask back to original size
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = inputDim;
  maskCanvas.height = inputDim;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Could not create mask context');

  const maskImgData = maskCtx.createImageData(inputDim, inputDim);
  for (let i = 0; i < outputData.length; i++) {
    const alphaValue = Math.round(outputData[i] * 255);
    const pixelIndex = i * 4;
    maskImgData.data[pixelIndex] = 255;     // Red
    maskImgData.data[pixelIndex + 1] = 255; // Green
    maskImgData.data[pixelIndex + 2] = 255; // Blue
    maskImgData.data[pixelIndex + 3] = alphaValue; // Alpha matte
  }
  maskCtx.putImageData(maskImgData, 0, 0);

  // Resize mask to match original size by drawing it on a resizing canvas
  const resizedMaskCanvas = document.createElement('canvas');
  resizedMaskCanvas.width = originalWidth;
  resizedMaskCanvas.height = originalHeight;
  const resizedMaskCtx = resizedMaskCanvas.getContext('2d');
  if (!resizedMaskCtx) throw new Error('Could not create resized mask context');

  resizedMaskCtx.drawImage(maskCanvas, 0, 0, originalWidth, originalHeight);
  const resizedMaskData = resizedMaskCtx.getImageData(0, 0, originalWidth, originalHeight).data;

  // 5. Apply the resized alpha mask to the original image pixels
  for (let i = 0; i < pixels.length; i += 4) {
    // Apply the alpha channel from the resized mask data
    const alphaMatteValue = resizedMaskData[i + 3];
    
    // We can also apply a slight threshold or multiplier to make cutouts cleaner
    pixels[i + 3] = alphaMatteValue < 20 ? 0 : alphaMatteValue;
  }

  // Update canvas with cut out transparency pixels
  finalCtx.putImageData(originalImgData, 0, 0);

  // Return canvas as PNG blob
  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    }, 'image/png');
  });
}
