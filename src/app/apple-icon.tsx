import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07090e',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M 20 50 C 20 20, 50 20, 50 50 C 50 80, 80 80, 80 50"
            stroke="#f8fafc"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 20 50 C 20 80, 50 80, 50 50 C 50 20, 80 20, 80 50"
            stroke="#f8fafc"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="10 10"
            opacity="0.5"
          />
          <circle cx="20" cy="50" r="8" fill="#f8fafc" />
          <circle cx="80" cy="50" r="8" fill="#f8fafc" />
          <circle cx="50" cy="50" r="6" fill="#f8fafc" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
