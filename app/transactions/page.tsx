'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { parseISO, format } from 'date-fns';
import { Transaction } from '@/types/finance';

export default function Transactions() {
  const { data, isLoading } = useAppData();
  const [search, setSearch] = useState('');
  
  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const txs = data?.Transactions || [];
  
  const filtered = txs.filter(t => 
    t.merchant?.includes(search) || t.subCategory?.includes(search) || t.memo?.includes(search) || String(t.amount).includes(search)
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">거래 내역</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => alert('새로운 내역 추가 팝업이 곧 연동됩니다.')}>+ 추가하기</button>
      </div>
      <input type="text" placeholder="검색어 (가맹점, 카테고리, 금액 등)..." className="w-full border rounded-lg p-3" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">일시</th>
              <th className="p-3">분류</th>
              <th className="p-3">결제수단</th>
              <th className="p-3">가맹점</th>
              <th className="p-3">금액</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => alert('이 내역을 수정하는 팝업이 뜹니다.')}>
                <td className="p-3">{t.date ? format(parseISO(t.date), 'MM.dd HH:mm') : ''}</td>
                <td className="p-3">{t.mainCategory} &gt; {t.subCategory}</td>
                <td className="p-3 text-slate-500">{t.fromAccountId || t.toAccountId || '-'}</td>
                <td className="p-3">{t.merchant}</td>
                <td className={'p-3 font-medium ' + (t.mainCategory === '수입' ? 'text-blue-600' : t.mainCategory === '지출' ? 'text-red-600' : 'text-emerald-600')}>
                  {t.mainCategory === '지출' ? '-' : '+'}{Number(t.amount).toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
