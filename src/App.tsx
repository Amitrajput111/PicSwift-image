import { useState } from 'react';
import Header from './components/Header';
import ImageCompressorComponent from './tools/ImageCompressor';
import BackgroundRemoverComponent from './tools/BackgroundRemover';
import ImageUpscalerComponent from './tools/ImageUpscaler';
import SeoContent from './components/SeoContent';
import AdPlaceholder from './components/AdPlaceholder';
import { X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('compress');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | null>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Workspace */}
      <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
        
        {/* Top Leaderboard Ad Slot */}
        <AdPlaceholder type="leaderboard" />

        {/* Dynamic Tool Router */}
        <div style={{ marginTop: '1rem' }}>
          {activeTab === 'compress' && <ImageCompressorComponent />}
          {activeTab === 'bg-remover' && <BackgroundRemoverComponent />}
          {activeTab === 'upscaler' && <ImageUpscalerComponent />}
        </div>

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
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem' }}>
            <span 
              onClick={() => setActiveModal('privacy')} 
              style={{ cursor: 'pointer' }}
              className="footer-link"
            >
              Privacy Policy
            </span>
            <span>•</span>
            <span 
              onClick={() => setActiveModal('terms')} 
              style={{ cursor: 'pointer' }}
              className="footer-link"
            >
              Terms of Service
            </span>
            <span>•</span>
            <span 
              onClick={() => setActiveModal('contact')} 
              style={{ cursor: 'pointer' }}
              className="footer-link"
            >
              Contact Us
            </span>
          </div>
        </div>
      </footer>

      {/* Legal Modals Dialog */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card animate-scale-up" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '80vh',
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
