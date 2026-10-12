import type { Metadata, Viewport } from 'next';
import { Sidebar } from '@/components/Sidebar';
import Providers from './providers';
import './globals.css';
import { GlobalFab } from '@/components/GlobalFab';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: '가계부',
  description: 'Google Sheets 기반 개인 자산 관리 가계부',
  manifest: '/calculator/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '가계부',
  },
  icons: {
    icon: [
      { url: '/calculator/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/calculator/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/calculator/icon-192x192.png', sizes: '192x192', type: 'image/png' },
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
      <head>
        <link rel="manifest" href="/calculator/manifest.json" />
        <link rel="apple-touch-icon" href="/calculator/icon-192x192.png" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            window.addEventListener("load", function() {
              var isCalc = window.location.pathname.indexOf("/calculator") !== -1;
              var swPath = isCalc ? "/calculator/sw.js" : "/sw.js";
              var swScope = isCalc ? "/calculator/" : "/";
              navigator.serviceWorker.register(swPath, { scope: swScope }).then(function(reg) {
                console.log("PWA Service Worker registered successfully with scope:", reg.scope);
              }).catch(function(err) {
                console.warn("PWA Service Worker registration error:", err);
              });
            });
          }
        ` }} />
        <Providers>
          <PwaInstallPrompt />
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
