import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Entregador — Pomar Fresh',
  description: 'App de entregas Pomar Fresh',
  manifest: '/entregador-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Entregador',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16a34a',
};

export default function EntregadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw-entregador.js').catch(function () {});
              });
            }
          `,
        }}
      />
    </div>
  );
}
