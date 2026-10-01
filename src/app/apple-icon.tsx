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
          background: '#0c1017',
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M 22 50 C 22 22, 50 22, 50 50 C 50 78, 78 78, 78 50"
            stroke="#00E599"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 22 50 C 22 78, 50 78, 50 50 C 50 22, 78 22, 78 50"
            stroke="#00E599"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="10 10"
            opacity="0.4"
          />
          <circle cx="22" cy="50" r="7.5" fill="#00E599" />
          <circle cx="78" cy="50" r="7.5" fill="#00E599" />
          <circle cx="50" cy="50" r="6" fill="#00E599" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
