import type { Metadata, Viewport } from 'next';
import { Outfit, Fraunces } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pomar Fresh Admin',
  description: 'Painel administrativo Pomar Fresh',
  icons: { icon: '/icon.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pomar Admin',
  },
  manifest: '/admin-manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2eb867',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
