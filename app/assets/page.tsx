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
  const txs = data?.Transactions || [];
  
  // 1. 역추적을 위한 현재 잔액 복사
  const currentBalances: Record<string, number> = {};
  accounts.forEach(a => currentBalances[a.id] = Number(a.balance));

  // 2. 미래부터 과거순으로 거래내역 정렬하여 일자별 잔액 역산
  const sortedTxs = [...txs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const dailyBalances: Record<string, Record<string, number>> = {}; // { '2026-10-01': { A001: 5000, TOTAL: ... } }
  
  // 기준점은 오늘 날짜
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // 만약 AssetValuations(vals) 데이터가 있다면 그걸 우선 사용, 없으면 Transactions 기반으로 자동 생성
  const hasValuations = vals.length > 0;
  const chartDataMap: Record<string, any> = {};

  if (hasValuations) {
    vals.forEach(v => {
      if (!v.date) return;
      const d = parseISO(v.date);
      if (d >= startDate && d <= endDate) {
        const dateStr = v.date.split('T')[0];
        if (!chartDataMap[dateStr]) chartDataMap[dateStr] = { date: dateStr };
        chartDataMap[dateStr][v.assetId] = Number(v.valuation);
      }
    });
  } else {
    // 자동 역산 (오늘부터 startDate까지)
    let curD = new Date(endDate > new Date() ? endDate : new Date());
    let activeBalances = { ...currentBalances };
    
    // 현재 잔액에서 출발하여 과거로 가며 거래내역을 반대로 적용 (지출은 더하고, 수입은 뺌)
    while (curD >= startDate) {
      const dateStr = format(curD, 'yyyy-MM-dd');
      
      // 이 날짜의 거래내역 찾기 (이 날짜에 일어난 거래는 그날 시작 잔액에서 '발생'한 것이므로, 이전 날짜 잔액을 구하려면 거래를 취소해야 함)
      // 정확히는, curD의 자정 잔액을 구하는 중... 복잡함을 피해 단순 합산
      const dayTxs = sortedTxs.filter(t => t.date && t.date.startsWith(dateStr));
      
      // 현재 activeBalances 저장
      chartDataMap[dateStr] = { date: dateStr };
      let dayTotal = 0;
      accounts.forEach(a => {
        chartDataMap[dateStr][a.id] = activeBalances[a.id] || 0;
        dayTotal += (activeBalances[a.id] || 0);
      });
      chartDataMap[dateStr]['TOTAL'] = dayTotal;
      
      // 거래내역 취소(과거로 가기 위해 지출은 잔액에 + 복구, 수입은 잔액에서 - 차감)
      dayTxs.forEach(t => {
        if (t.mainCategory === '지출') activeBalances[t.fromAccountId] += Number(t.amount);
        if (t.mainCategory === '수입') activeBalances[t.fromAccountId] -= Number(t.amount);
        // 저축/투자 등 이동은 생략
      });

      curD.setDate(curD.getDate() - 1);
    }
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
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              선택한 산정 기간 내 자산 평가(AssetValuations) 데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis tickFormatter={v => (v/10000)+'만'} />
                <Tooltip formatter={(v: any) => Number(v).toLocaleString()+'원'} />
                {selectedAssets.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={id} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#6366f1'][i%7]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">보유 계좌 / 자산 리스트 (체크박스로 그래프 표시)</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 w-12 text-center">
                <input type="checkbox" checked={selectedAssets.includes('TOTAL')} onChange={(e) => {
                  if (e.target.checked) setSelectedAssets(prev => [...prev, 'TOTAL']);
                  else setSelectedAssets(prev => prev.filter(x => x !== 'TOTAL'));
                }} />
              </th>
              <th className="p-3">금융기관</th>
              <th className="p-3">계좌/자산명</th>
              <th className="p-3">유형</th>
              <th className="p-3 text-right">잔액/평가액</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 text-center border-b"></td>
              <td colSpan={3} className="p-3 font-bold border-b text-blue-600">총 자산 (TOTAL)</td>
              <td className="p-3 text-right font-bold text-blue-600 border-b">{totalBalance.toLocaleString()} KRW</td>
            </tr>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b hover:bg-slate-50">
                <td className="p-3 text-center">
                  <input type="checkbox" checked={selectedAssets.includes(acc.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedAssets(prev => [...prev, acc.id]);
                    else setSelectedAssets(prev => prev.filter(x => x !== acc.id));
                  }} />
                </td>
                <td className="p-3 font-medium">{acc.institution}</td>
                <td className="p-3">{acc.name}</td>
                <td className="p-3 text-slate-500">
                  {acc.type === 'cash' ? '현금' : acc.type === 'savings' ? '예적금' : acc.type === 'investment' ? '투자' : acc.type === 'loan' ? '대출' : '신용카드'}
                </td>
                <td className="p-3 text-right font-medium text-slate-700">{Number(acc.balance).toLocaleString()} {acc.currency || 'KRW'}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">등록된 계좌가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
