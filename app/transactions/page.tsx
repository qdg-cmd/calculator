'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { parseISO, format } from 'date-fns';
import { Transaction } from '@/types/finance';
import { TransactionModal } from '@/components/TransactionModal';

export default function Transactions() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Transaction>('Transactions');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const txs = data?.Transactions || [];
  const accounts = data?.Accounts || [];
  const categories = data?.Categories || [];
  
  const filtered = txs.filter(t => 
    t.mainCategory?.includes(search) ||
    t.merchant?.includes(search) || 
    t.subCategory?.includes(search) || 
    t.memo?.includes(search) || 
    String(t.amount).includes(search) ||
    (t.date && format(parseISO(t.date), 'yyyy-MM-dd').includes(search))
  ).sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const handleSave = (tx: Partial<Transaction>) => {
    if (editingTx) {
      mutate.mutate({ action: 'UPDATE', data: tx });
    } else {
      mutate.mutate({ action: 'CREATE', data: tx });
    }
  };

  const getAccountName = (accId?: string) => {
    if (!accId) return '-';
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.institution : accId;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">거래 내역</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm" 
          onClick={() => { setEditingTx(null); setIsModalOpen(true); }}>
          + 추가하기
        </button>
      </div>
      
      <input type="text" placeholder="일시, 금액, 분류, 가맹점 등으로 검색..." 
        className="w-full border rounded-lg p-3 text-sm" 
        value={search} onChange={e => setSearch(e.target.value)} />
        
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">일시</th>
              <th className="p-3">분류</th>
              <th className="p-3">결제수단</th>
              <th className="p-3">가맹점</th>
              <th className="p-3 text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b hover:bg-slate-50 cursor-pointer" 
                onClick={() => { setEditingTx(t); setIsModalOpen(true); }}>
                <td className="p-3">{t.date ? format(parseISO(t.date), 'MM.dd HH:mm') : ''}</td>
                <td className="p-3">{t.mainCategory} &gt; {t.subCategory}</td>
                <td className="p-3 text-slate-500">{getAccountName(t.fromAccountId)}</td>
                <td className="p-3">{t.merchant}</td>
                <td className={'p-3 font-medium text-right ' + 
                  (t.mainCategory === '수입' ? 'text-blue-600' : 
                   t.mainCategory === '지출' ? 'text-red-600' : 
                   'text-emerald-600')}>
                  {t.mainCategory === '지출' ? '-' : '+'}{Number(t.amount).toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        initialData={editingTx}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
