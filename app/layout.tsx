import { Sidebar } from '@/components/Sidebar';
import './globals.css';

export const metadata = {
  title: '개인 자산 관리 (PFM)',
  description: 'Google Sheets 기반 개인 자산 관리 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Sidebar />
        <main className="md:pl-64 pb-16 md:pb-0 min-h-screen">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
