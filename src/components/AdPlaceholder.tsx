import React from 'react';

interface AdPlaceholderProps {
  type?: 'leaderboard' | 'rectangle' | 'sidebar';
  className?: string;
  style?: React.CSSProperties;
}

export default function AdPlaceholder({ type = 'leaderboard', className = '', style }: AdPlaceholderProps) {
  // Dimensions based on standard ad units
  const dimensions = {
    leaderboard: { width: '100%', height: '90px', maxW: '970px' },
    rectangle: { width: '100%', height: '250px', maxW: '300px' },
    sidebar: { width: '100%', height: '600px', maxW: '300px' }
  };

  const current = dimensions[type];

  return (
    <div
      className={`ad-container ${className}`}
      style={{
        width: current.width,
        height: current.height,
        maxWidth: current.maxW,
        margin: '1.5rem auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.015)',
        border: '1px dashed var(--border-color)',
        borderRadius: '12px',
        padding: '1rem',
        ...style
      }}
    >
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.25rem' }}>
        SPONSOR AD PLACEHOLDER
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.7 }}>
        {type === 'leaderboard' ? '728 x 90 Leaderboard' : type === 'rectangle' ? '300 x 250 Medium Rectangle' : '300 x 600 Half Page'}
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.4, marginTop: '0.25rem' }}>
        (Replace this container with your Google AdSense code block)
      </div>
    </div>
  );
}
