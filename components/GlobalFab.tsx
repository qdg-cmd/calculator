'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { TransactionModal } from '@/components/TransactionModal';
import { Transaction } from '@/types/finance';

export function GlobalFab() {
  const { data } = useAppData();
  const mutate = useOptimisticMutation<Transaction>('Transactions');
  const [isOpen, setIsOpen] = useState(false);

  // 만약 데이터 로딩 전이더라도 모달 껍데기는 준비해둡니다.
  const accounts = data?.Accounts || [];
  const categories = data?.Categories || [];

  const handleSave = (tx: Partial<Transaction>) => {
    mutate.mutate({ action: 'CREATE', data: tx });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl font-light transition-transform hover:scale-110 z-40"
        aria-label="새 거래내역 추가"
      >
        +
      </button>

      <TransactionModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSave={handleSave} 
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
