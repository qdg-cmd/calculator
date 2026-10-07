'use client';
import { useState } from 'react';
import { useAppData } from '@/lib/googleSheetsApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Assets() {
  const { data, isLoading } = useAppData();
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['TOTAL']);

  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const vals = data?.AssetValuations || [];
  const accounts = data?.Accounts || [];

  const totalBalance = accounts.reduce((a,b) => a + Number(b.balance), 0);

  const chartDataMap: any = {};
  vals.forEach(v => {
    const d = v.date ? v.date.split('T')[0] : '';
    if (!chartDataMap[d]) chartDataMap[d] = { date: d };
    chartDataMap[d][v.assetId] = Number(v.valuation);
  });
  const chartData = Object.values(chartDataMap).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold">자산 포트폴리오</h1>
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <p className="text-slate-300">현재 총 순자산</p>
        <h2 className="text-3xl font-bold mt-2">{totalBalance.toLocaleString()}원</h2>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold mb-4">자산 현황 추이 (체크박스로 그래프 켜고 끄기)</h3>
        <div className="flex gap-4 mb-4 flex-wrap">
          {['TOTAL', ...Array.from(new Set(vals.map(v => v.assetId).filter(id => id !== 'TOTAL')))].map(id => (
            <label key={id} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1 rounded-full border">
              <input type="checkbox" checked={selectedAssets.includes(id)} onChange={(e) => {
                if (e.target.checked) setSelectedAssets(prev => [...prev, id]);
                else setSelectedAssets(prev => prev.filter(x => x !== id));
              }} />
              <span className="text-sm">{id === 'TOTAL' ? '총 자산' : id}</span>
            </label>
          ))}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis tickFormatter={v => (v/10000)+'만'} />
              <Tooltip formatter={v => Number(v).toLocaleString()+'원'} />
              {selectedAssets.map((id, i) => (
                <Line key={id} type="monotone" dataKey={id} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'][i%5]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
