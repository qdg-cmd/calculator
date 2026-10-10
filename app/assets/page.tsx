'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';
import { Account } from '@/types/finance';

export default function Assets() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Account>('Accounts');
  const { baseDay, periodType, selectedDate } = useDateStore();
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['TOTAL']);

  const handleAdd = () => {
    const name = prompt('계좌/자산명을 입력하세요:');
    if(!name) return;
    const institution = prompt('금융기관명을 입력하세요:');
    const type = prompt('유형(현금/신용카드/투자/대출)을 입력하세요:', '현금');
    const bal = prompt('초기 잔액을 입력하세요:', '0');
    mutate.mutate({ action: 'CREATE', data: { id: 'A'+Date.now(), name, institution: institution || '', type: type as any, balance: Number(bal) || 0, currency: 'KRW' } });
  };

  const handleDelete = (id: string) => {
    if(confirm('이 계좌를 삭제하시겠습니까?')) mutate.mutate({ action: 'DELETE', data: { id } });
  };

  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const vals = data?.AssetValuations || [];
  const accounts = (data?.Accounts || []).filter(a => a && a.id && String(a.id).trim() !== '' && a.name);

  const totalBalance = accounts.reduce((a,b) => a + Number(b.balance), 0);
  
  // Date Range Filtering
  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);
  const txs = data?.Transactions || [];
  
  // 1. 역추적을 위한 현재 잔액 복사
  const currentBalances: Record<string, number> = {};
  accounts.forEach(a => currentBalances[a.id] = Number(a.balance));

  // 2. 미래부터 과거순으로 거래내역 정렬하여 일자별 잔액 역산
  const sortedTxs = [...txs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const dailyBalances: Record<string, Record<string, number>> = {}; // { '2026-10-01': { A001: 5000, TOTAL: ... } }
  
  // 기준점은 오늘 날짜
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // 항상 Transactions 기반으로 자동 역산 (오늘부터 startDate까지)
  const chartDataMap: Record<string, any> = {};
  let curD = new Date(endDate > new Date() ? endDate : new Date());
  let activeBalances = { ...currentBalances };
  
  // 현재 잔액에서 출발하여 과거로 가며 거래내역을 반대로 적용 (지출은 더하고, 수입은 뺌)
  while (curD >= startDate) {
    const dateStr = format(curD, 'yyyy-MM-dd');
    
    const dayTxs = sortedTxs.filter(t => t.date && t.date.startsWith(dateStr));
    
    chartDataMap[dateStr] = { date: dateStr };
    let dayTotal = 0;
    accounts.forEach(a => {
      chartDataMap[dateStr][a.id] = activeBalances[a.id] || 0;
      dayTotal += (activeBalances[a.id] || 0);
    });
    chartDataMap[dateStr]['TOTAL'] = dayTotal;
    
    dayTxs.forEach(t => {
      if (t.mainCategory === '지출') activeBalances[t.fromAccountId] += Number(t.amount);
      if (t.mainCategory === '수입') activeBalances[t.fromAccountId] -= Number(t.amount);
      // 이체 로직: fromAccountId 에는 다시 더해주고, toAccountId 에서는 빼줌
      if (t.mainCategory === '저축' || t.mainCategory === '투자') {
        if (t.fromAccountId) activeBalances[t.fromAccountId] += Number(t.amount);
        if (t.toAccountId) activeBalances[t.toAccountId] -= Number(t.amount);
      }
    });

    curD.setDate(curD.getDate() - 1);
  }
  
  const chartData = Object.values(chartDataMap)
    .filter((d: any) => parseISO(d.date) >= startDate && parseISO(d.date) <= endDate)
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

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
        <h3 className="font-bold mb-4">자산 현황 추이</h3>
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tickFormatter={(v) => v ? v.slice(5, 10).replace('-', '/') : ''} style={{fontSize: 12}} />
                <YAxis tickFormatter={v => (v/10000)+'만'} />
                <Tooltip formatter={(v: any) => Number(v).toLocaleString()+'원'} />
                {selectedAssets.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={id} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#6366f1'][i%7]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">보유 계좌 / 자산 리스트 (체크박스로 그래프 표시)</h3><button onClick={handleAdd} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">+ 자산 추가</button>
        </div>
        
        {/* Desktop Table */}
        <table className="hidden md:table w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 w-12 text-center">그래프</th>
              <th className="p-3">금융기관</th>
              <th className="p-3">계좌/자산명</th>
              <th className="p-3">유형</th>
              <th className="p-3 text-right">잔액/평가액</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-b cursor-pointer transition-colors ${selectedAssets.includes('TOTAL') ? 'bg-indigo-50' : 'hover:bg-slate-50'}`} 
                onClick={() => setSelectedAssets(prev => prev.includes('TOTAL') ? prev.filter(x => x !== 'TOTAL') : [...prev, 'TOTAL'])}>
              <td className="p-3 text-center">
                <div className={`w-4 h-4 rounded-full mx-auto ${selectedAssets.includes('TOTAL') ? 'bg-indigo-500' : 'border-2 border-slate-300'}`}></div>
              </td>
              <td colSpan={3} className="p-3 font-bold text-blue-600">총 자산 (TOTAL)</td>
              <td className="p-3 text-right font-bold text-blue-600">{totalBalance.toLocaleString()} KRW</td>
            </tr>
            {accounts.map(acc => (
              <tr key={acc.id} className={`border-b cursor-pointer transition-colors ${selectedAssets.includes(acc.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedAssets(prev => prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id])}>
                <td className="p-3 text-center">
                  <div className={`w-4 h-4 rounded-full mx-auto ${selectedAssets.includes(acc.id) ? 'bg-indigo-500' : 'border-2 border-slate-300'}`}></div>
                </td>
                <td className="p-3 font-medium">{acc.institution}</td>
                <td className="p-3">{acc.name}</td>
                <td className="p-3 text-slate-500">
                  {acc.type === 'cash' ? '현금' : acc.type === 'savings' ? '예적금' : acc.type === 'investment' ? '투자' : acc.type === 'loan' ? '대출' : '신용카드'}
                </td>
                <td className="p-3 text-right font-medium text-slate-700">{Number(acc.balance).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card Layout */}
        <div className="md:hidden flex flex-col">
          <div className={`p-4 border-b cursor-pointer transition-colors ${selectedAssets.includes('TOTAL') ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white active:bg-slate-50'}`}
               onClick={() => setSelectedAssets(prev => prev.includes('TOTAL') ? prev.filter(x => x !== 'TOTAL') : [...prev, 'TOTAL'])}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-600">총 자산 (TOTAL)</span>
              <span className="font-bold text-blue-600">{totalBalance.toLocaleString()} KRW</span>
            </div>
          </div>
          {accounts.map(acc => (
            <div key={acc.id} className={`p-4 border-b cursor-pointer transition-colors ${selectedAssets.includes(acc.id) ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white active:bg-slate-50'}`}
                 onClick={() => setSelectedAssets(prev => prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id])}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">{acc.name}</span>
                <span className="font-bold text-slate-700">{Number(acc.balance).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{acc.institution}</span>
                <span>{acc.type === 'cash' ? '현금' : acc.type === 'savings' ? '예적금' : acc.type === 'investment' ? '투자' : acc.type === 'loan' ? '대출' : '신용카드'}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
