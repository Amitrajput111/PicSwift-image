import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
}

export default function Dropzone({
  onFileSelect,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxSizeMB = 25,
  label = 'Drag & drop your image here, or click to browse'
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file type
    // Note: HEIC files might not have full browser MIME support initially, we can validate extension as fallback
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAcceptedType = acceptedTypes.includes(fileType) || 
      (acceptedTypes.includes('image/heic') && (fileExtension === '.heic' || fileExtension === '.heif'));

    if (!isAcceptedType) {
      setError('Unsupported file type. Please upload a JPEG, PNG, WebP or HEIC image.');
      return false;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className="glass-card"
        style={{
          border: isDragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3.5rem 2rem',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          backgroundColor: isDragActive ? 'rgba(0, 242, 254, 0.03)' : 'var(--bg-card)',
          borderRadius: '16px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleChange}
          accept={acceptedTypes.join(',')}
        />
        
        <div style={{
          background: isDragActive ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.02)',
          color: isDragActive ? '#0a0c10' : 'var(--text-secondary)',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: isDragActive ? '0 4px 15px var(--accent-shadow)' : 'none'
        }}>
          {isDragActive ? <Upload size={28} /> : <ImageIcon size={28} />}
        </div>

        <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {label}
        </p>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Supports PNG, JPG, WebP, HEIC up to {maxSizeMB}MB
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--error)',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
