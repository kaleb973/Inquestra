import { ImageResponse } from 'next/og';

export const alt = 'Inquestra — Hardware DAQ & Electronic Lab Notebook for Biomedical Engineering';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#07090e',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(0, 229, 153, 0.12) 0%, transparent 50%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: '#121824',
              border: '1px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
              <path
                d="M 20 50 C 20 20, 50 20, 50 50 C 50 80, 80 80, 80 50"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 20 50 C 20 80, 50 80, 50 50 C 50 20, 80 20, 80 50"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="10 10"
                opacity="0.5"
              />
              <circle cx="20" cy="50" r="8" fill="#ffffff" />
              <circle cx="80" cy="50" r="8" fill="#ffffff" />
              <circle cx="50" cy="50" r="6" fill="#ffffff" />
            </svg>
          </div>
          <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f3f4f6' }}>
            Inquestra
          </span>
          <span style={{ marginLeft: '12px', fontSize: '14px', color: '#00E599', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(0, 229, 153, 0.3)', backgroundColor: 'rgba(0, 229, 153, 0.08)', fontWeight: 600 }}>
            FDA 21 CFR Part 11 Compliant
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#f9fafb',
              margin: 0,
              letterSpacing: '-0.03em',
            }}
          >
            Hardware DAQ meets immutable research protocols.
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#9ca3af',
              margin: 0,
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            Direct Web Serial streaming from ESP32, Arduino &amp; Teensy sensors into cryptographically sealed laboratory notebooks.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #1f2937',
            paddingTop: '28px',
            fontSize: '16px',
            color: '#6b7280',
            fontFamily: 'monospace',
          }}
        >
          <span>Chromium Web Serial API · Zero Driver Setup</span>
          <span style={{ color: '#00E599' }}>Deterministic SHA-256 Provenance</span>
          <span>inquestra.org</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
