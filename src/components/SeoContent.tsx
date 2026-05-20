import { ShieldCheck, HelpCircle, Laptop } from 'lucide-react';


interface SeoContentProps {
  tool: string;
}

export default function SeoContent({ tool }: SeoContentProps) {
  const contentMap: Record<string, { title: string; desc: string; steps: string[]; faqs: { q: string; a: string }[] }> = {
    compress: {
      title: 'Free Smart Image Compressor - Compress to Exact KB Size',
      desc: 'Our online image size compressor is designed for professionals, students, and job applicants who need to fit strict upload criteria. Whether you are submitting a passport photo to an official Indian portal, uploading a signature, or optimizing web graphics, this utility lets you target an exact file size (e.g., under 20KB, 50KB, or 100KB) instantly.',
      steps: [
        'Upload your image by dragging and dropping it into the dashboard or clicking browse.',
        'Enter your desired maximum target file size in Kilobytes (KB).',
        'Choose whether to export as JPEG, PNG, or WebP.',
        'Click "Compress Image". Our binary search algorithm runs in your browser, compressing the image repeatedly until the output meets your target constraint without dropping quality unnecessarily.',
        'Hit "Download" to save your optimized file.'
      ],
      faqs: [
        {
          q: 'Is my image data secure?',
          a: 'Yes, 100%. Unlike other file compression platforms, our image compressor operates entirely client-side. Your photo is never uploaded to a remote server. The compression calculations are executed in your browser tab locally.'
        },
        {
          q: 'How does target-size compression work?',
          a: 'Our smart algorithm uses a binary search method. It runs a loop in a fraction of a second, adjusting resolution and compression quality matrices until the output file fits the specified KB limit perfectly.'
        },
        {
          q: 'What formats are supported?',
          a: 'We support input in JPG, JPEG, PNG, WebP, and HEIC. You can convert and compress them into standard JPEG, PNG, or WebP configurations.'
        }
      ]
    },
    'bg-remover': {
      title: 'Free AI Background Remover - Remove Backgrounds Locally in HD',
      desc: 'PicSwift Background Eraser offers high-definition image segmentation without any limits. Most online tools require credit payments or watermarks to download high-resolution results. Our platform utilizes local WebAssembly deep learning models to perform AI cutouts directly on your device, completely free.',
      steps: [
        'Drop your photo (portrait, product, or logo) into the workspace.',
        'Wait a few seconds for the AI engine to load the deep learning segmentation model.',
        'The model processes the image pixel-by-pixel locally using your GPU or CPU.',
        'Download your cut-out transparent PNG image in high resolution with zero watermarks.'
      ],
      faqs: [
        {
          q: 'Does it cost money to download HD background cutouts?',
          a: 'No. PicSwift is completely free. We do not restrict downloads to low-resolution previews. You get the full high-definition output without watermarks.'
        },
        {
          q: 'Why does the first download take a few seconds to start?',
          a: 'The first time you run the background remover, your browser downloads a lightweight AI neural network (~5MB) from a CDN. Once downloaded, it is cached locally in your browser storage, making subsequent uses near-instant.'
        },
        {
          q: 'Is my private photo uploaded to any AI server?',
          a: 'Never. The neural network runs locally in your browser context using WebAssembly (WASM). Your personal images never leave your computer, ensuring absolute privacy.'
        }
      ]
    },
    upscaler: {
      title: 'Free AI Image Upscaler & Enhancer - Super Resolution Online',
      desc: 'PicSwift Super-Resolution Enhancer restores details in blurry, low-resolution images. Using advanced convolutional neural networks running locally, our upscaler increases image resolution by 2x or 4x, making photos crisper, text readable, and graphics sharp.',
      steps: [
        'Upload your low-resolution photo or design.',
        'Select your desired upscale factor (2x or 4x magnification).',
        'The local AI model reconstructs missing pixel details using your browser WebGPU/WebAssembly resources.',
        'Compare the before and after preview and download your high-quality enhanced image.'
      ],
      faqs: [
        {
          q: 'What is AI Super-Resolution?',
          a: 'Traditional upscaling stretches pixels, resulting in blurry images. AI Super-Resolution uses neural networks to predict and draw in missing details, yielding sharp edges and realistic textures.'
        },
        {
          q: 'Is there a file size limit?',
          a: 'To prevent browser tab crashes on low-spec devices, we recommend inputting images below 4MB. The upscaled output can be downloaded in high resolution.'
        },
        {
          q: 'Does this run on my device or a server?',
          a: 'It runs entirely on your device using WebAssembly (ONNX Runtime Web), ensuring your data remains private and secure.'
        }
      ]
    }
  };

  const current = contentMap[tool] || contentMap.compress;

  return (
    <section className="glass-card" style={{ marginTop: '3rem', padding: '2.5rem' }}>
      <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
        {current.title}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '2rem' }}>
        {current.desc}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Why offline */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 600 }}>100% Secure & Private</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Your files never touch our servers. All operations happen in-browser on your local machine, keeping your personal photos completely safe.
            </p>
          </div>
        </div>

        {/* Local Processing */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
            <Laptop size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 600 }}>Client-Side Speed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              By utilizing your local CPU and GPU through WebAssembly, PicSwift processes files instantly without queuing, delays, or network latency.
            </p>
          </div>
        </div>

      </div>

      <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />

      {/* Steps */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HelpCircle size={20} style={{ color: 'var(--accent-primary)' }} />
          How to use:
        </h3>
        <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.95rem' }}>
          {current.steps.map((step, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem' }}>{step}</li>
          ))}
        </ol>
      </div>

      {/* FAQs */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {current.faqs.map((faq, idx) => (
            <div key={idx}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {faq.q}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
