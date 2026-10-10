import { Sidebar } from '@/components/Sidebar';
import Providers from './providers';
import './globals.css';
import { GlobalFab } from '@/components/GlobalFab';

export const metadata = {
  title: '개인 자산 관리(PFM)',
  description: 'Google Sheets 기반 개인 자산 관리 대시보드',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
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
