import { useEffect, useState } from 'react';
import Header from './components/Header';
import ImageCompressorComponent from './tools/ImageCompressor';
import BackgroundRemoverComponent from './tools/BackgroundRemover';
import ImageUpscalerComponent from './tools/ImageUpscaler';
import SeoContent from './components/SeoContent';
import AdPlaceholder from './components/AdPlaceholder';
import { X, Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';
import { 
  getCurrentUser, 
  getUsageCount, 
  isUserLoggedIn, 
  signupUserApi, 
  loginUserApi, 
  logoutUserApi,
  checkServerSession
} from './utils/usageTracker';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('compress');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  
  // Auth state management
  const [user, setUser] = useState<{ email: string; name?: string } | null>(getCurrentUser());
  const [usages, setUsages] = useState<number>(getUsageCount());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Auth Form State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    // Verify server session on application mount
    checkServerSession();

    const handleUsage = () => {
      const currentUsages = getUsageCount();
      setUsages(currentUsages);
      if (currentUsages >= 3 && !isUserLoggedIn()) {
        setShowAuthModal(true);
      }
    };
    
    const handleAuth = () => {
      setUser(getCurrentUser());
      setUsages(getUsageCount());
    };

    window.addEventListener('usage_incremented', handleUsage);
    window.addEventListener('auth_state_changed', handleAuth);
    
    return () => {
      window.removeEventListener('usage_incremented', handleUsage);
      window.removeEventListener('auth_state_changed', handleAuth);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    if (authMode === 'signup' && !name) {
      setAuthError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);

    try {
      let result;
      if (authMode === 'signup') {
        result = await signupUserApi(email, password, name);
      } else {
        result = await loginUserApi(email, password);
      }

      if (result.success) {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        setName('');
      } else {
        setAuthError(result.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Failed to connect to backend server. Is it running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signupUserApi('amit.rajput@gmail.com', 'google_mock_secured_password_123', 'Amit Rajput');
      if (result.success) {
        setShowAuthModal(false);
      } else {
        const loginRes = await loginUserApi('amit.rajput@gmail.com', 'google_mock_secured_password_123');
        if (loginRes.success) {
          setShowAuthModal(false);
        } else {
          setAuthError('Google Account login failed.');
        }
      }
    } catch (err) {
      setAuthError('Failed to connect to backend authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const isGated = usages >= 3 && !user;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onAuthClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
        onLogoutClick={() => logoutUserApi()}
      />

      {/* Main Content Workspace */}
      <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
        
        {/* Top Leaderboard Ad Slot */}
        <AdPlaceholder type="leaderboard" />

        {/* Dynamic Tool Router OR Limit Gate */}
        {isGated ? (
          <div className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            gap: '1.5rem',
            border: '2px solid var(--accent-primary)',
            borderRadius: '16px',
            boxShadow: '0 0 30px var(--accent-shadow)',
            background: 'rgba(10, 12, 16, 0.85)',
            backdropFilter: 'blur(20px)',
            maxWidth: '600px',
            margin: '3rem auto'
          }}>
            <div style={{
              background: 'var(--accent-gradient)',
              color: '#0a0c10',
              width: '60px',
              height: '60px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '800',
              boxShadow: '0 4px 15px var(--accent-shadow)'
            }}>
              P
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.5rem' }}>
                Unlock Unlimited Processing 🚀
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto', lineHeight: 1.6 }}>
                You have processed 3 files for free. Create a free PicSwift account to unlock unlimited client-side image compression, background removal, and upscaling.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px', marginTop: '1rem' }}>
              <button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="btn btn-primary"
                style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '10px', fontWeight: 700 }}
              >
                Sign Up Free
              </button>
              <button 
                onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '10px', fontWeight: 600 }}
              >
                Log In to Existing Account
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {activeTab === 'compress' && <ImageCompressorComponent />}
            {activeTab === 'bg-remover' && <BackgroundRemoverComponent />}
            {activeTab === 'upscaler' && <ImageUpscalerComponent />}
          </div>
        )}

        {/* Dynamic SEO Informational Copy */}
        <SeoContent tool={activeTab} />

        {/* Bottom Leaderboard Ad Slot */}
        <AdPlaceholder type="leaderboard" style={{ marginTop: '3rem' }} />

      </main>

      {/* Modern footer */}
      <footer style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 0',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)'
      }}>
        <div className="container">
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            PicSwift — Privacy-Focused Creative Suite
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            DEVELOPED BY AMIT RAJPUT
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto', lineHeight: '1.5', marginBottom: '1rem' }}>
            All operations run locally in your browser context. No media files are ever transmitted to any remote servers. 
            Enjoy free, secure, and fast processing.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontWeight: 500 }}>
            <span onClick={() => setActiveModal('privacy')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} className="hover-link">Privacy Policy</span>
            <span>•</span>
            <span onClick={() => setActiveModal('terms')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} className="hover-link">Terms of Service</span>
            <span>•</span>
            <span onClick={() => setActiveModal('contact')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} className="hover-link">Contact Us</span>
          </div>
        </div>
      </footer>

      {/* Auth Gate Modal Popup */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 6, 8, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '2.5rem',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Let user close auth modal only if they are not forced blocked */}
            {!isGated && (
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            )}

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.25rem' }}>
                {authMode === 'signin' ? 'Welcome Back' : 'Create Free Account'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {authMode === 'signin' ? 'Sign in to access unlimited local utilities' : 'One click to unlock unlimited private processing'}
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: authMode === 'signin' ? 'var(--accent-primary)' : 'none',
                  color: authMode === 'signin' ? '#0a0c10' : 'var(--text-secondary)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: authMode === 'signup' ? 'var(--accent-primary)' : 'none',
                  color: authMode === 'signup' ? '#0a0c10' : 'var(--text-secondary)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--error)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {authMode === 'signup' && (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                    <Sparkles size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  marginTop: '0.5rem'
                }}
              >
                {authLoading ? 'Verifying...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Account
            </button>
          </div>
        </div>
      )}

      {/* Legal & Profile Modals */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 6, 8, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '550px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {activeModal === 'privacy' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Privacy Policy</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  At PicSwift, we prioritize user privacy. Because our site runs completely client-side in the browser, your image files are processed locally and are <strong>never</strong> sent to or stored on any external servers.
                </p>
                <h3 style={{ fontSize: '1.1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Google AdSense & Third-Party Cookies</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  We use Google AdSense cookies to show ads when you visit our website. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Google Ad Settings</a>.
                </p>
                <h3 style={{ fontSize: '1.1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>GDPR & CCPA Compliance</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  We collect no personal data, emails, or biometric markers. Any cookie-based choices for localized advertisements can be adjusted through browser cookie settings.
                </p>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Terms of Service</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  Welcome to PicSwift. By accessing our tools, you agree to these Terms of Service.
                </p>
                <h3 style={{ fontSize: '1.1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Ownership & Copyright</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  You retain full, unrestricted ownership and copyrights to all images you process with PicSwift. We claim zero rights, credentials, or licensing permissions over your uploaded and output materials.
                </p>
                <h3 style={{ fontSize: '1.1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Disclaimer of Warranties</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  The application is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability or fitness for a particular purpose.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  We do not guarantee that the service will be uninterrupted or error-free.
                </p>
              </div>
            )}

            {activeModal === 'contact' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Contact & Founder Info</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Amit Rajput</h3>
                    <p style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                      Founder & AI Engineer
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Building AI-powered products and modern software solutions focused on simplicity, performance, and real-world impact.
                    </p>
                  </div>
                  
                  <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                      <a href="mailto:amitrajput98267313@gmail.com" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                        amitrajput98267313@gmail.com
                      </a>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>LinkedIn:</span>
                      <a href="https://linkedin.com/in/amitrajput111" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                        linkedin.com/in/amitrajput111
                      </a>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>GitHub:</span>
                      <a href="https://github.com/Amitrajput111" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                        github.com/Amitrajput111
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => setActiveModal(null)}
              className="btn btn-secondary"
              style={{ marginTop: '2rem', width: '100%' }}
            >
              Close Window
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
