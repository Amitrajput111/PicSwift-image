import { useState } from 'react';
import { Download, RefreshCw, Layers, ArrowRight, Eye } from 'lucide-react';

import Dropzone from '../components/Dropzone';
import { compressToTargetSize } from '../utils/compression';
import AdPlaceholder from '../components/AdPlaceholder';
import { incrementUsageCount } from '../utils/usageTracker';

export default function ImageCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetSize, setTargetSize] = useState<number>(50); // Default 50KB
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  
  const [compressing, setCompressing] = useState<boolean>(false);
  const [compressedResult, setCompressedResult] = useState<{
    blob: Blob;
    url: string;
    quality: number;
    sizeKB: number;
    originalKB: number;
  } | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCompressedResult(null);
    // Estimate default target size as 50% of original, capped at 100KB minimum or original size
    const originalKB = file.size / 1024;
    setTargetSize(Math.min(Math.round(originalKB * 0.5), 100));
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setCompressing(true);
    try {
      const result = await compressToTargetSize(selectedFile, targetSize, format);
      const url = URL.createObjectURL(result.blob);
      setCompressedResult({
        blob: result.blob,
        url,
        quality: result.quality,
        sizeKB: result.sizeKB,
        originalKB: Number((selectedFile.size / 1024).toFixed(2))
      });
      incrementUsageCount();
    } catch (err) {
      console.error('Compression failed:', err);
      alert('Failed to compress image. Try another file or format.');
    } finally {
      setCompressing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    setCompressedResult(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {!selectedFile ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Compress Images to Exact Size
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Instantly compress files to fit strict form upload limits. Everything operates offline in your browser.
            </p>
          </div>
          <Dropzone onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Controls Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
              Compression Settings
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Target File Size (Max KB)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  value={targetSize}
                  onChange={(e) => setTargetSize(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                  min="1"
                />
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '0.5rem' }}>KB</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Original size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Output Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {(['image/jpeg', 'image/webp', 'image/png'] as const).map((type) => {
                  const label = type.split('/')[1].toUpperCase();
                  const isSelected = format === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormat(type)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem', borderRadius: '8px' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

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
                onClick={handleCompress}
                disabled={compressing}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                {compressing ? 'Compressing...' : 'Compress Image'}
              </button>
            </div>

          </div>

          {/* Previews / Output Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {compressedResult ? 'Comparison Result' : 'Original Preview'}
            </h3>

            {/* Preview Box */}
            <div style={{
              flex: 1,
              minHeight: '260px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              padding: '1rem'
            }}>
              {compressedResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: '100%' }}>
                  <img
                    src={compressedResult.url}
                    alt="Compressed output"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', margin: '0 auto', borderRadius: '8px' }}
                  />
                  
                  {/* Output details card */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Original Size:</span>
                      <span style={{ fontWeight: 600 }}>{compressedResult.originalKB.toFixed(1)} KB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Compressed Size:</span>
                      <span style={{
                        fontWeight: 700,
                        color: compressedResult.sizeKB <= targetSize ? 'var(--success)' : 'var(--warning)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {compressedResult.originalKB > compressedResult.sizeKB ? (
                          <>
                            {compressedResult.originalKB.toFixed(0)}KB 
                            <ArrowRight size={14} /> 
                            {compressedResult.sizeKB} KB
                          </>
                        ) : `${compressedResult.sizeKB} KB`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Compression Ratio:</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {compressedResult.originalKB > compressedResult.sizeKB 
                          ? `${Math.round((1 - compressedResult.sizeKB / compressedResult.originalKB) * 100)}% smaller`
                          : 'No change'}
                      </span>
                    </div>
                    {format !== 'image/png' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Quality Factor:</span>
                        <span style={{ fontWeight: 600 }}>{compressedResult.quality}%</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
                    <a
                      href={compressedResult.url}
                      download={`${selectedFile.name.replace(/\.[^/.]+$/, "")}-min.${format.split('/')[1]}`}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <Download size={18} />
                      Download Compressed Image
                    </a>
                    
                    <button
                      onClick={() => window.open(compressedResult.url, '_blank')}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
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
