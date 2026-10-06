'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDateStore } from '@/store/useDateStore';
import { format } from 'date-fns';
import { Search, Plus, Filter, Trash2, Edit } from 'lucide-react';

export default function TransactionsPage() {
  const { getPeriod } = useDateStore();
  const period = getPeriod();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mainFilter, setMainFilter] = useState('전체');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">거래 내역 관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            {format(period.start, 'yyyy.MM.dd')} ~ {format(period.end, 'yyyy.MM.dd')}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> 신규 등록
          </button>
        </div>
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
                  <th className="px-6 py-3">계좌</th>
                  <th className="px-6 py-3 text-right">금액</th>
                  <th className="px-6 py-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {/* 뼈대 데이터 렌더링 예시 */}
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4">2026.10.17 14:30</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">지출 &gt; 식비</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">스타벅스 강남점</div>
                    <div className="text-xs text-slate-500">점심 커피</div>
                  </td>
                  <td className="px-6 py-4">토스뱅크</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">-4,500원</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button className="text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                      <button className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
