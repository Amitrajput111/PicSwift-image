import { useEffect, useState } from 'react';
import { Sun, Moon, Sparkles, Image, Minimize2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const navItems = [
    { id: 'compress', label: 'Smart Compressor', icon: Minimize2 },
    { id: 'bg-remover', label: 'AI BG Remover', icon: Sparkles },
    { id: 'upscaler', label: 'AI Upscaler', icon: Image },
  ];

  return (
    <header className="glass-card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', padding: '1rem 2rem', marginBottom: '2rem' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('compress')}>
          <div style={{
            background: 'var(--accent-gradient)',
            color: '#0a0c10',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            boxShadow: '0 4px 10px var(--accent-shadow)'
          }}>
            P
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              PicSwift
            </h1>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              100% Free & Private
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  borderRadius: '10px',
                }}
              >
                <Icon size={16} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          aria-label="Toggle Theme"
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

      </div>
      
      {/* Small style tweak for responsive layout */}
      <style>{`
        @media (max-width: 640px) {
          .nav-label {
            display: none;
          }
          header > div {
            justify-content: center !important;
          }
        }
      `}</style>
    </header>
  );
}
