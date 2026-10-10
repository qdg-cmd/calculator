'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/transactions');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-slate-500">거래 내역으로 이동 중...</p>
    </div>
  );
}
