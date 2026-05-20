import { useState } from 'react';
import { Sparkles, Download, RefreshCw, AlertCircle, Cpu, Eye } from 'lucide-react';
import Dropzone from '../components/Dropzone';
import { loadImage } from '../utils/compression';
import { removeBackground } from '../utils/onnxHelper';
import AdPlaceholder from '../components/AdPlaceholder';
import { incrementUsageCount } from '../utils/usageTracker';

export default function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [stage, setStage] = useState<'idle' | 'loading-model' | 'processing' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [resultResult, setResultResult] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultResult(null);
    setStage('idle');
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;

    setStage('loading-model');
    setLoadingPercent(0);
    setErrorMessage(null);

    try {
      // 1. Load image element
      const img = await loadImage(selectedFile);

      // 2. Process image with progress hooks
      const resultBlob = await removeBackground(img, (percent) => {
        setLoadingPercent(percent);
        if (percent >= 100) {
          setStage('processing');
        }
      });

      const url = URL.createObjectURL(resultBlob);
      setResultResult({
        blob: resultBlob,
        url
      });
      setStage('completed');
      incrementUsageCount();
    } catch (err) {
      console.error('Background removal error:', err);
      setErrorMessage(
        err instanceof Error 
          ? err.message 
          : 'AI processing failed. Please ensure your device supports WebAssembly and try again.'
      );
      setStage('error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (resultResult?.url) URL.revokeObjectURL(resultResult.url);
    setResultResult(null);
    setStage('idle');
    setErrorMessage(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {!selectedFile ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Free AI Background Remover
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Cut out portrait and product photos in HD entirely in your browser. No signups, no watermarks.
            </p>
          </div>
          <Dropzone onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Controls & Status Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={20} style={{ color: 'var(--accent-primary)' }} />
              AI Execution Panel
            </h3>

            {/* Stage Progress View */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.15)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                  {stage === 'idle' && 'Ready to Process'}
                  {stage === 'loading-model' && `Downloading AI Model (${loadingPercent}%)`}
                  {stage === 'processing' && 'AI Segmenting Image...'}
                  {stage === 'completed' && 'Processing Completed!'}
                  {stage === 'error' && 'Execution Error'}
                </div>
              </div>

              {stage === 'loading-model' && (
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${loadingPercent}%`,
                    height: '100%',
                    background: 'var(--accent-gradient)',
                    transition: 'width 0.2s ease',
                    boxShadow: '0 0 8px var(--accent-primary)'
                  }} />
                </div>
              )}

              {stage === 'processing' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--accent-primary)',
                  fontSize: '0.9rem'
                }}>
                  <RefreshCw size={16} className="animate-spin-slow" />
                  <span>Computing pixels using local CPU/GPU WebAssembly...</span>
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
            </div>

            <AdPlaceholder type="rectangle" />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <RefreshCw size={16} />
                Reset
              </button>
              {stage === 'idle' && (
                <button
                  onClick={handleRemoveBackground}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  <Sparkles size={16} />
                  Remove Background
                </button>
              )}
            </div>

          </div>

          {/* Result Showcase Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {stage === 'completed' ? 'Background Removed (PNG)' : 'Original Preview'}
            </h3>

            {/* Checkerboard Pattern for transparent backgrounds */}
            <div style={{
              flex: 1,
              minHeight: '280px',
              background: stage === 'completed'
                ? 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)'
                : 'rgba(0, 0, 0, 0.25)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
              backgroundColor: stage === 'completed' ? 'var(--text-primary)' : 'rgba(0, 0, 0, 0.25)', // high contrast support
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '1rem',
              position: 'relative'
            }}>
              {stage === 'completed' && resultResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: '100%' }}>
                  <img
                    src={resultResult.url}
                    alt="Cutout output"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      margin: '0 auto',
                      borderRadius: '8px',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
                    }}
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
                    <a
                      href={resultResult.url}
                      download={`${selectedFile.name.replace(/\.[^/.]+$/, "")}-no-bg.png`}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <Download size={18} />
                      Download HD PNG
                    </a>
                    
                    <button
                      onClick={() => window.open(resultResult.url, '_blank')}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', opacity: stage === 'processing' ? 0.4 : 1 }}>
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
