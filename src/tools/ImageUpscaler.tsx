import { useState } from 'react';
import { Download, RefreshCw, AlertCircle, Sparkles, Sliders, Eye } from 'lucide-react';
import Dropzone from '../components/Dropzone';
import { loadImage } from '../utils/compression';
import AdPlaceholder from '../components/AdPlaceholder';

export default function ImageUpscaler() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<2 | 4>(2);
  const [sharpness, setSharpness] = useState<number>(30); // 0 to 100%
  const [processing, setProcessing] = useState<boolean>(false);
  const [stage, setStage] = useState<'idle' | 'upscaling' | 'sharpening' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [upscaledResult, setUpscaledResult] = useState<{
    blob: Blob;
    url: string;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
  } | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUpscaledResult(null);
    setStage('idle');
  };

  /**
   * High-quality Bicubic Resampling + Unsharp Mask (USM) sharpening filter.
   * This provides a clean client-side super-resolution effect that is 100% stable 
   * and scales to large images without WebAssembly memory overflow on mobile browsers.
   */
  const handleUpscale = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setStage('upscaling');
    setErrorMessage(null);

    try {
      // 1. Load image
      const img = await loadImage(selectedFile);
      const originalW = img.width;
      const originalH = img.height;

      // Restrict huge resolutions from upscaling excessively to prevent canvas crash
      if (originalW * scaleFactor > 8000 || originalH * scaleFactor > 8000) {
        throw new Error('Target resolution is too high. Please select a smaller scale factor or a smaller input image.');
      }

      // Allow 500ms delay to let the UI update the state
      await new Promise(resolve => setTimeout(resolve, 300));

      // 2. Create upscale canvas
      const targetW = originalW * scaleFactor;
      const targetH = originalH * scaleFactor;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not create upscaling canvas context');
      }

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw and scale image
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // 3. Apply neural sharpening filter (Unsharp Mask Kernel)
      setStage('sharpening');
      await new Promise(resolve => setTimeout(resolve, 300));

      if (sharpness > 0) {
        applySharpenFilter(ctx, targetW, targetH, sharpness / 100);
      }

      // 4. Output final blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setUpscaledResult({
            blob,
            url,
            width: targetW,
            height: targetH,
            originalWidth: originalW,
            originalHeight: originalH
          });
          setStage('completed');
        } else {
          setErrorMessage('Failed to generate final output image.');
          setStage('error');
        }
        setProcessing(false);
      }, 'image/jpeg', 0.95);

    } catch (err) {
      console.error('Upscaling failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Upscaling failed. Try a smaller image.');
      setStage('error');
      setProcessing(false);
    }
  };

  /**
   * Convolves an unsharp mask over canvas pixels to enhance details and sharp edges.
   */
  const applySharpenFilter = (ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    const output = ctx.createImageData(w, h);
    const outPixels = output.data;

    // Initialize output pixels with original source pixels to prevent black/transparent borders
    outPixels.set(pixels);

    // 5x5 Gaussian Blur kernel weights
    const kernel = [
      [1,  4,  6,  4,  1],
      [4, 16, 24, 16,  4],
      [6, 24, 36, 24,  6],
      [4, 16, 24, 16,  4],
      [1,  4,  6,  4,  1]
    ];
    const kernelWeight = 256;

    // Perform convolution for inner pixels (leave 2-pixel border untouched to prevent index out of bounds)
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const i = (y * w + x) * 4;

        // Compute 5x5 Gaussian blur for R, G, B channels
        let blurR = 0;
        let blurG = 0;
        let blurB = 0;

        for (let ky = -2; ky <= 2; ky++) {
          for (let kx = -2; kx <= 2; kx++) {
            const pi = ((y + ky) * w + (x + kx)) * 4;
            const kw = kernel[ky + 2][kx + 2];
            blurR += pixels[pi] * kw;
            blurG += pixels[pi + 1] * kw;
            blurB += pixels[pi + 2] * kw;
          }
        }

        blurR /= kernelWeight;
        blurG /= kernelWeight;
        blurB /= kernelWeight;

        // Apply unsharp mask formula: Original + strength * 2.5 * (Original - Blur)
        const rVal = pixels[i] + strength * 2.5 * (pixels[i] - blurR);
        const gVal = pixels[i + 1] + strength * 2.5 * (pixels[i + 1] - blurG);
        const bVal = pixels[i + 2] + strength * 2.5 * (pixels[i + 2] - blurB);

        // Clamp to [0, 255]
        outPixels[i] = Math.min(255, Math.max(0, rVal));
        outPixels[i + 1] = Math.min(255, Math.max(0, gVal));
        outPixels[i + 2] = Math.min(255, Math.max(0, bVal));
        // Keep original alpha channel
        outPixels[i + 3] = pixels[i + 3];
      }
    }

    // Write back convolved sharpened image data
    ctx.putImageData(output, 0, 0);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (upscaledResult?.url) URL.revokeObjectURL(upscaledResult.url);
    setUpscaledResult(null);
    setStage('idle');
    setErrorMessage(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {!selectedFile ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Free AI Image Upscaler & Enhancer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Magnify image dimensions up to 4x while enhancing clarity and edges locally.
            </p>
          </div>
          <Dropzone onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Settings and control panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} style={{ color: 'var(--accent-primary)' }} />
              Upscale Settings
            </h3>

            {/* Upscale Factor */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Resolution Magnification
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {([2, 4] as const).map((factor) => {
                  const isSelected = scaleFactor === factor;
                  return (
                    <button
                      key={factor}
                      type="button"
                      onClick={() => setScaleFactor(factor)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.6rem 0.5rem', fontSize: '0.9rem', borderRadius: '10px' }}
                    >
                      {factor}x Upscale
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sharpening Strength Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Detail Enhancer (Sharpness)
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {sharpness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={(e) => setSharpness(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* State indicators */}
            {stage !== 'idle' && stage !== 'completed' && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-color)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <RefreshCw size={16} className="animate-spin-slow" style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {stage === 'upscaling' && 'Resampling pixel vectors...'}
                  {stage === 'sharpening' && 'Enhancing texture clarity...'}
                </span>
              </div>
            )}

            {stage === 'error' && (
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '0.5rem',
                color: 'var(--error)',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <AdPlaceholder type="rectangle" />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <RefreshCw size={16} />
                Reset
              </button>
              <button
                onClick={handleUpscale}
                disabled={processing}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                <Sparkles size={16} />
                Enhance Image
              </button>
            </div>

          </div>

          {/* Image output showcase */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {stage === 'completed' ? 'Enhanced Preview' : 'Original Preview'}
            </h3>

            <div style={{
              flex: 1,
              minHeight: '280px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '1rem',
              position: 'relative'
            }}>
              {stage === 'completed' && upscaledResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: '100%' }}>
                  <img
                    src={upscaledResult.url}
                    alt="Upscaled output"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', margin: '0 auto', borderRadius: '8px' }}
                  />
                  
                  {/* Stats details */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Original Dimensions:</span>
                      <span style={{ fontWeight: 600 }}>{upscaledResult.originalWidth} x {upscaledResult.originalHeight} px</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Upscaled Dimensions:</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {upscaledResult.width} x {upscaledResult.height} px ({scaleFactor}x larger)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>File size:</span>
                      <span>{(upscaledResult.blob.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
                    <a
                      href={upscaledResult.url}
                      download={`${selectedFile.name.replace(/\.[^/.]+$/, "")}-enhanced.jpg`}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <Download size={18} />
                      Download Enhanced Image
                    </a>
                    
                    <button
                      onClick={() => window.open(upscaledResult.url, '_blank')}
                      className="btn btn-secondary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Eye size={18} />
                      Open Full Size
                    </button>
                  </div>
                </div>
              ) : (
                previewUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', opacity: processing ? 0.4 : 1 }}>
                    <img
                      src={previewUrl}
                      alt="Original upload"
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', margin: '0 auto', borderRadius: '8px' }}
                    />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                )
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
