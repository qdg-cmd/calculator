'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDateStore } from '@/store/useDateStore';
import { useTransactions } from '@/lib/googleSheetsApi';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Search, Plus } from 'lucide-react';

export default function TransactionsPage() {
  const { getPeriod } = useDateStore();
  const period = getPeriod();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mainFilter, setMainFilter] = useState('전체');

  const { data: transactions = [], isLoading } = useTransactions();

  // 날짜, 검색어, 대분류 필터링
  const filtered = transactions.filter(tx => {
    try {
      const d = typeof tx.date === 'string' ? parseISO(tx.date) : new Date(tx.date);
      if (!isWithinInterval(d, { start: period.start, end: period.end })) return false;
      if (mainFilter !== '전체' && tx.mainCategory !== mainFilter) return false;
      if (searchTerm) {
        const keyword = searchTerm.toLowerCase();
        if (!tx.merchant?.toLowerCase().includes(keyword) && !tx.memo?.toLowerCase().includes(keyword)) return false;
      }
      return true;
    } catch { return false; }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">거래 내역 관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            {format(period.start, 'yyyy.MM.dd')} ~ {format(period.end, 'yyyy.MM.dd')}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> 신규 등록
        </button>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="가맹점, 메모 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
              />
            </div>
            <select 
              value={mainFilter} 
              onChange={(e) => setMainFilter(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="전체">전체 대분류</option>
              <option value="지출">지출</option>
              <option value="수입">수입</option>
              <option value="저축">저축</option>
              <option value="투자">투자</option>
              <option value="이체">이체</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">일시</th>
                  <th className="px-6 py-3">분류</th>
                  <th className="px-6 py-3">가맹점 / 메모</th>
                  <th className="px-6 py-3 text-right">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-500">데이터를 불러오는 중입니다...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-500">해당 기간에 거래 내역이 없습니다.</td></tr>
                ) : (
                  filtered.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{format(new Date(tx.date), 'MM.dd HH:mm')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tx.type === 'expense' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                          {tx.mainCategory} &gt; {tx.subCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{tx.merchant}</div>
                        <div className="text-xs text-slate-500">{tx.memo}</div>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'expense' ? 'text-red-500' : 'text-blue-600'}`}>
                        {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toLocaleString()}원
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
