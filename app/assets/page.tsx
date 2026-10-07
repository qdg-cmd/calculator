'use client';
import { useState } from 'react';
import { useAppData } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

export default function Assets() {
  const { data, isLoading } = useAppData();
  const { baseDay, periodType, selectedDate } = useDateStore();
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['TOTAL']);

  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const vals = data?.AssetValuations || [];
  const accounts = data?.Accounts || [];

  const totalBalance = accounts.reduce((a,b) => a + Number(b.balance), 0);
  
  // Date Range Filtering
  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);

  const chartDataMap: Record<string, any> = {};
  vals.forEach(v => {
    if (!v.date) return;
    const d = parseISO(v.date);
    if (d >= startDate && d <= endDate) {
      const dateStr = v.date.split('T')[0];
      if (!chartDataMap[dateStr]) chartDataMap[dateStr] = { date: dateStr };
      chartDataMap[dateStr][v.assetId] = Number(v.valuation);
    }
  });
  
  const chartData = Object.values(chartDataMap).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold">자산 포트폴리오</h1>
      
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center">
        <div>
          <p className="text-slate-300">현재 총 자산</p>
          <h2 className="text-3xl font-bold mt-2">{totalBalance.toLocaleString()}원</h2>
        </div>
        <div className="text-right mt-4 md:mt-0 text-sm text-slate-400">
          기준: {format(startDate, 'yyyy.MM.dd')} ~ {format(endDate, 'yyyy.MM.dd')}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold mb-4">자산 현황 추이 (체크박스로 그래프 켜고 끄기)</h3>
        <div className="flex gap-4 mb-4 flex-wrap">
          {['TOTAL', ...Array.from(new Set(vals.map(v => v.assetId).filter(id => id !== 'TOTAL')))].map(id => (
            <label key={id} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1 rounded-full border hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={selectedAssets.includes(id)} onChange={(e) => {
                if (e.target.checked) setSelectedAssets(prev => [...prev, id]);
                else setSelectedAssets(prev => prev.filter(x => x !== id));
              }} />
              <span className="text-sm">{id === 'TOTAL' ? '총 자산' : id}</span>
            </label>
          ))}
        </div>
        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">해당 기간의 평가 데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis tickFormatter={v => (v/10000)+'만'} />
                <Tooltip formatter={(v: any) => Number(v).toLocaleString()+'원'} />
                {selectedAssets.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={id} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'][i%5]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">보유 계좌 / 자산 리스트</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">금융기관</th>
              <th className="p-3">계좌/자산명</th>
              <th className="p-3">유형</th>
              <th className="p-3 text-right">잔액/평가액</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b hover:bg-slate-50">
                <td className="p-3">{acc.institution}</td>
                <td className="p-3 font-medium">{acc.name}</td>
                <td className="p-3 text-slate-500">
                  {acc.type === 'cash' ? '현금' : acc.type === 'savings' ? '예적금' : acc.type === 'investment' ? '투자' : acc.type === 'loan' ? '대출' : '신용카드'}
                </td>
                <td className="p-3 text-right font-medium text-slate-700">{Number(acc.balance).toLocaleString()} {acc.currency || 'KRW'}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">등록된 계좌가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
