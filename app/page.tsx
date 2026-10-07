'use client';
import { useState } from 'react';
import { useAppData } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ComposedChart, Line } from 'recharts';
import { parseISO, isSameDay, format } from 'date-fns';

export default function Dashboard() {
  const { data, isLoading, error } = useAppData();
  const { baseDay, periodType, selectedDate, setBaseDay, setPeriodType, setSelectedDate } = useDateStore();
  const [viewMode, setViewMode] = useState<'monthly'|'calendar'|'yearly'>('monthly');
  const [paymentModalAccount, setPaymentModalAccount] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-center">데이터를 불러오는 중입니다...</div>;
  if (error || !data) return <div className="p-8 text-red-500">오류가 발생했습니다.</div>;

  const txs = data.Transactions || [];
  const accounts = data.Accounts || [];
  
  // Date Range calculation
  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);
  const parsedDate = new Date(selectedDate);
  const currentYear = parsedDate.getFullYear();

  // Filter for Monthly / Calendar
  const monthlyTxs = txs.filter(tx => {
    if (!tx.date) return false;
    const d = parseISO(tx.date);
    return d >= startDate && d <= endDate;
  });

  // Filter for Yearly
  const yearlyTxs = txs.filter(tx => {
    if (!tx.date) return false;
    return parseISO(tx.date).getFullYear() === currentYear;
  });

  const activeTxs = viewMode === 'yearly' ? yearlyTxs : monthlyTxs;

  const totalIncome = activeTxs.filter(t => t.mainCategory === '수입').reduce((a, t) => a + Number(t.amount), 0);
  const totalExpense = activeTxs.filter(t => t.mainCategory === '지출').reduce((a, t) => a + Number(t.amount), 0);
  const totalSavings = activeTxs.filter(t => t.mainCategory === '저축' || t.mainCategory === '투자').reduce((a, t) => a + Number(t.amount), 0);
  
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0;
  const savingsRatio = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0;

  // Calendar setup
  const calendarDays: Date[] = [];
  let curD = new Date(startDate);
  while (curD <= endDate) {
    calendarDays.push(new Date(curD));
    curD.setDate(curD.getDate() + 1);
  }

  const getAccountName = (accId: string) => {
    if (accId === 'unknown') return '미분류/기타';
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.institution : accId;
  };

  const expenseByAccountMonthly = monthlyTxs.filter(t => t.mainCategory === '지출').reduce((acc, t) => {
    const accId = t.fromAccountId || 'unknown';
    acc[accId] = (acc[accId] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const expenseByAccountYearly = yearlyTxs.filter(t => t.mainCategory === '지출').reduce((acc, t) => {
    const accId = t.fromAccountId || 'unknown';
    acc[accId] = (acc[accId] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const currentExpenseByAccount = viewMode === 'yearly' ? expenseByAccountYearly : expenseByAccountMonthly;

  const currentPieData = Object.entries(
    (viewMode === 'yearly' ? yearlyTxs : monthlyTxs).filter(t => t.mainCategory === '지출').reduce((acc, t) => {
      acc[t.subCategory || '기타'] = (acc[t.subCategory || '기타'] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>)
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      {/* 1. 최상단: 산정기준일 헤더 바 */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const newD = new Date(selectedDate);
            newD.setMonth(newD.getMonth() - 1);
            setSelectedDate(newD.toISOString());
          }} className="px-2 border rounded">&lt;</button>
          <span className="font-bold text-lg">{format(new Date(selectedDate), 'yyyy년 MM월')}</span>
          <button onClick={() => {
            const newD = new Date(selectedDate);
            newD.setMonth(newD.getMonth() + 1);
            setSelectedDate(newD.toISOString());
          }} className="px-2 border rounded">&gt;</button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setPeriodType('calendar')} className={`px-3 py-1 rounded-md ${periodType === 'calendar' ? 'bg-white shadow' : ''}`}>달력기준</button>
            <button onClick={() => setPeriodType('salary')} className={`px-3 py-1 rounded-md ${periodType === 'salary' ? 'bg-white shadow' : ''}`}>월급기준</button>
          </div>
          {periodType === 'salary' && (
            <div className="flex items-center gap-1">
              <span>기준일:</span>
              <select value={baseDay} onChange={e => setBaseDay(Number(e.target.value))} className="border rounded px-2 py-1">
                {Array.from({length:31}).map((_, i) => <option key={i} value={i+1}>{i+1}일</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-center text-sm text-slate-500">
        현재 조회 기간: {format(startDate, 'yyyy.MM.dd')} ~ {format(endDate, 'yyyy.MM.dd')}
      </p>

      {/* 2. 보기 모드 전환 (월간, 캘린더, 연간) */}
      <div className="flex gap-2 mb-4 border-b pb-4">
        <button onClick={() => setViewMode('monthly')} className={`px-4 py-2 rounded-lg font-bold ${viewMode === 'monthly' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>월간 요약</button>
        <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg font-bold ${viewMode === 'calendar' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>캘린더 뷰</button>
        <button onClick={() => setViewMode('yearly')} className={`px-4 py-2 rounded-lg font-bold ${viewMode === 'yearly' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>연간 요약</button>
      </div>

      {/* 3. 핵심 KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 mb-1">총 수입</p>
          <h2 className="text-2xl font-bold text-blue-600">{totalIncome.toLocaleString()}원</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 mb-1">총 지출 (수입대비 {expenseRatio}%)</p>
          <h2 className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString()}원</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 mb-1">저축/투자 (수입대비 {savingsRatio}%)</p>
          <h2 className="text-2xl font-bold text-emerald-600">{totalSavings.toLocaleString()}원</h2>
        </div>
      </div>

      {/* 4. 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="font-bold text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: calendarDays[0].getDay()}).map((_, i) => <div key={'empty'+i} className="min-h-[80px]" />)}
            {calendarDays.map(day => {
              const dayTxs = monthlyTxs.filter(t => t.date && isSameDay(parseISO(t.date), day));
              const inc = dayTxs.filter(t => t.mainCategory === '수입').reduce((a,b) => a+Number(b.amount), 0);
              const exp = dayTxs.filter(t => t.mainCategory === '지출').reduce((a,b) => a+Number(b.amount), 0);
              const sav = dayTxs.filter(t => t.mainCategory === '저축' || t.mainCategory === '투자').reduce((a,b) => a+Number(b.amount), 0);
              
              return (
                <div key={day.toISOString()} className="min-h-[80px] border rounded p-1 flex flex-col text-xs relative bg-slate-50">
                  <span className="font-medium">{day.getDate()}</span>
                  <div className="mt-1 space-y-1">
                    {inc > 0 && <div className="text-blue-600 flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>{inc.toLocaleString()}</div>}
                    {exp > 0 && <div className="text-red-600 flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>{exp.toLocaleString()}</div>}
                    {sav > 0 && <div className="text-emerald-600 flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{sav.toLocaleString()}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5, 6. 월간 & 연간 뷰 공통 */}
      {(viewMode === 'monthly' || viewMode === 'yearly') && (
        <div className="space-y-6">
          {viewMode === 'yearly' && (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold mb-4">{currentYear}년 월별 지출/수입/투자 흐름</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={
                    Array.from({length: 12}).map((_, i) => {
                      const mtxs = yearlyTxs.filter(t => t.date && parseISO(t.date).getMonth() === i);
                      return {
                        month: `${i+1}월`,
                        income: mtxs.filter(t => t.mainCategory === '수입').reduce((a,b)=>a+Number(b.amount),0),
                        expense: mtxs.filter(t => t.mainCategory === '지출').reduce((a,b)=>a+Number(b.amount),0),
                        savings: mtxs.filter(t => t.mainCategory === '저축' || t.mainCategory === '투자').reduce((a,b)=>a+Number(b.amount),0),
                      }
                    })
                  }>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={v => (v/10000)+'만'} />
                    <Tooltip formatter={(v: any) => Number(v).toLocaleString()+'원'} />
                    <Bar dataKey="income" name="수입" fill="#3b82f6" />
                    <Bar dataKey="expense" name="지출" fill="#ef4444" />
                    <Line type="monotone" dataKey="savings" name="투자/저축" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold mb-4">{viewMode === 'yearly' ? '연간' : '월간'} 카테고리별 지출 비율</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={currentPieData.map(([name, value]) => ({name, value}))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8"
                      label={({name, percent}) => name + ' (' + ((percent || 0) * 100).toFixed(0) + '%)'}
                    >
                      {currentPieData.map((_, index) => (
                        <Cell key={'cell-' + index} fill={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][index % 7]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => Number(val || 0).toLocaleString() + '원'} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold mb-4">{viewMode === 'yearly' ? '연간' : '월간'} 결제수단별 지출 비용 (클릭 시 상세)</h3>
              <div className="space-y-3">
                {Object.entries(currentExpenseByAccount).sort((a,b)=>b[1]-a[1]).map(([accId, amount]) => {
                  const ratio = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
                  return (
                    <div key={accId} 
                      className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      onClick={() => setPaymentModalAccount(accId)}>
                      <div>
                        <span className="font-medium text-slate-800 block">{getAccountName(accId)}</span>
                        <span className="text-xs text-slate-400">지출 대비 {ratio}%</span>
                      </div>
                      <span className="font-bold text-red-600">{amount.toLocaleString()}원</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {paymentModalAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">{getAccountName(paymentModalAccount)} 결제 내역 ({viewMode === 'yearly' ? '연간' : '월간'})</h3>
              <button onClick={() => setPaymentModalAccount(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="p-3">날짜</th>
                    <th className="p-3">카테고리</th>
                    <th className="p-3">내역</th>
                    <th className="p-3 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewMode === 'yearly' ? yearlyTxs : monthlyTxs)
                    .filter(t => (t.fromAccountId === paymentModalAccount || (t.fromAccountId === undefined && paymentModalAccount === 'unknown')) && t.mainCategory === '지출')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(t => (
                    <tr key={t.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{t.date}</td>
                      <td className="p-3">{t.subCategory || '기타'}</td>
                      <td className="p-3">{t.merchant || t.memo}</td>
                      <td className="p-3 text-right font-bold text-red-600">{Number(t.amount).toLocaleString()}원</td>
                    </tr>
                  ))}
                  {(viewMode === 'yearly' ? yearlyTxs : monthlyTxs)
                    .filter(t => (t.fromAccountId === paymentModalAccount || (t.fromAccountId === undefined && paymentModalAccount === 'unknown')) && t.mainCategory === '지출').length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">결제 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
