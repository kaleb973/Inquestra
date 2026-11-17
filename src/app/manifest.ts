import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inquestra — Modern Electronic Lab Notebook and Research Platform',
    short_name: 'Inquestra',
    description: 'Hardware DAQ and 21 CFR Part 11 technical controls Electronic Research Notebook for Life Sciences, Chemistry, Biotech, and Engineering.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090e',
    theme_color: '#07090e',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
