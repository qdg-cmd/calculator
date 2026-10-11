import type { Metadata, Viewport } from 'next';
import { Sidebar } from '@/components/Sidebar';
import Providers from './providers';
import './globals.css';
import { GlobalFab } from '@/components/GlobalFab';

export const metadata: Metadata = {
  title: '가계부',
  description: 'Google Sheets 기반 개인 자산 관리 가계부',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '가계부',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            window.addEventListener("load", function() {
              navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(function(reg) {
                console.log("PWA Service Worker registered:", reg.scope);
              }).catch(function(err) {
                console.warn("PWA Service Worker registration failed:", err);
              });
            });
          }
        ` }} />
        <Providers>
          <Sidebar />
          <main className="md:pl-64 pb-16 md:pb-0 min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </main>
          <GlobalFab />
        </Providers>
      </body>
    </html>
  );
}
