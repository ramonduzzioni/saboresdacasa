import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sabores da Casa | Doces & Salgados Artesanais',
    short_name: 'Sabores da Casa',
    description: 'Gestão de Pedidos, Produção, Cardápio e Entregas - Sabores da Casa',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#6E473B',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
