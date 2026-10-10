'use client';
import { useState } from 'react';
import { useAppData } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ComposedChart, Line } from 'recharts';
import { parseISO, isSameDay, format } from 'date-fns';
import { Transaction } from '@/types/finance';

type ModalFilter = {
  type: 'account' | 'date' | 'category';
  value: string;
} | null;

export default function Dashboard() {
  const { data, isLoading, error } = useAppData();
  const { baseDay, periodType, selectedDate, setBaseDay, setPeriodType, setSelectedDate } = useDateStore();
  const [viewMode, setViewMode] = useState<'monthly'|'calendar'|'yearly'>('monthly');
  const [modalFilter, setModalFilter] = useState<ModalFilter>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  if (isLoading) return <div className="p-8 text-center">데이터를 불러오는 중입니다...</div>;
  if (error || !data) return <div className="p-8 text-red-500">오류가 발생했습니다.</div>;

  const txs = data.Transactions || [];
  const accounts = data.Accounts || [];
  
  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);
  const parsedDate = new Date(selectedDate);
  const currentYear = parsedDate.getFullYear();

  const monthlyTxs = txs.filter(tx => {
    if (!tx.date) return false;
    const d = parseISO(tx.date);
    return d >= startDate && d <= endDate;
  });

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

  const calendarDays: Date[] = [];
  let curD = new Date(startDate);
  while (curD <= endDate) {
    calendarDays.push(new Date(curD));
    curD.setDate(curD.getDate() + 1);
  }

  const getAccountName = (accId: string) => {
    if (accId === 'unknown' || !accId) return '미분류/기타';
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.institution : accId;
  };

  const currentExpenseByAccount = activeTxs.filter(t => t.mainCategory === '지출').reduce((acc, t) => {
    const accId = t.fromAccountId || 'unknown';
    acc[accId] = (acc[accId] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const currentPieData = Object.entries(
    activeTxs.filter(t => t.mainCategory === '지출').reduce((acc, t) => {
      acc[t.subCategory || '기타'] = (acc[t.subCategory || '기타'] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>)
  );

  const handlePeriodChange = (pt: 'calendar'|'salary') => {
    setPeriodType(pt);
    setSelectedDate(new Date().toISOString());
  };

  const handleBaseDayChange = (bd: number) => {
    setBaseDay(bd);
    setSelectedDate(new Date().toISOString());
  };

  // Modal logic
  const filteredModalTxs = activeTxs.filter(t => {
    if (t.mainCategory !== '지출') return false;
    if (!modalFilter) return false;
    if (modalFilter.type === 'account') {
      return (t.fromAccountId === modalFilter.value) || (!t.fromAccountId && modalFilter.value === 'unknown');
    }
    if (modalFilter.type === 'category') {
      return (t.subCategory === modalFilter.value) || (!t.subCategory && modalFilter.value === '기타');
    }
    if (modalFilter.type === 'date') {
      return isSameDay(parseISO(t.date), new Date(modalFilter.value));
    }
    return false;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let modalTitle = '';
  if (modalFilter?.type === 'account') modalTitle = `${getAccountName(modalFilter.value)} 결제 내역`;
  else if (modalFilter?.type === 'category') modalTitle = `${modalFilter.value} 카테고리 내역`;
  else if (modalFilter?.type === 'date') modalTitle = `${format(new Date(modalFilter.value), 'yyyy-MM-dd')} 결제 내역`;

  return (
    <div className="space-y-6 pb-24">
      {/* 1. 최상단: 산정기준일 헤더 바 */}
      <div className="bg-white p-3 md:p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3 whitespace-nowrap">
        <div className="flex items-center justify-between gap-2 whitespace-nowrap">
          <button onClick={() => {
            const newD = new Date(selectedDate);
            newD.setMonth(newD.getMonth() - 1);
            setSelectedDate(newD.toISOString());
          }} className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100">&lt;</button>
          <span className="font-bold text-base md:text-lg">{format(new Date(selectedDate), 'yyyy년 MM월')}</span>
          <button onClick={() => {
            const newD = new Date(selectedDate);
            newD.setMonth(newD.getMonth() + 1);
            setSelectedDate(newD.toISOString());
          }} className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100">&gt;</button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm whitespace-nowrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => handlePeriodChange('calendar')} className={`px-2 md:px-3 py-1 rounded-md transition-colors ${periodType === 'calendar' ? 'bg-white shadow font-bold' : ''}`}>달력기준</button>
            <button onClick={() => handlePeriodChange('salary')} className={`px-2 md:px-3 py-1 rounded-md transition-colors ${periodType === 'salary' ? 'bg-white shadow font-bold' : ''}`}>월급기준</button>
          </div>
          {periodType === 'salary' && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-slate-500">기준일:</span>
              <select value={baseDay} onChange={e => handleBaseDayChange(Number(e.target.value))} className="border rounded px-2 py-1 bg-white font-medium">
                {Array.from({length:31}).map((_, i) => <option key={i} value={i+1}>{i+1}일</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-center text-xs md:text-sm text-slate-500">
        조회 기간: {format(startDate, 'yyyy.MM.dd')} ~ {format(endDate, 'yyyy.MM.dd')}
      </p>

      {/* 2. 보기 모드 전환 */}
      <div className="flex gap-2 mb-4 border-b pb-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button onClick={() => setViewMode('monthly')} className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${viewMode === 'monthly' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>월간 요약</button>
        <button onClick={() => setViewMode('calendar')} className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${viewMode === 'calendar' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>캘린더 뷰</button>
        <button onClick={() => setViewMode('yearly')} className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${viewMode === 'yearly' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>연간 요약</button>
      </div>

      {/* 3. 핵심 KPI 카드 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 whitespace-nowrap">
        <div className="bg-white p-3 md:p-6 rounded-xl border shadow-sm whitespace-nowrap">
          <p className="text-[10px] md:text-sm text-slate-500 mb-1">총 수입</p>
          <h2 className="font-bold text-blue-600 whitespace-nowrap tracking-tighter truncate text-xs md:text-2xl">{totalIncome.toLocaleString()}원</h2>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl border shadow-sm whitespace-nowrap">
          <p className="text-[10px] md:text-sm text-slate-500 mb-1">총 지출 <span className="hidden md:inline">(수입대비 {expenseRatio}%)</span></p>
          <h2 className="font-bold text-red-600 whitespace-nowrap tracking-tighter truncate text-xs md:text-2xl">{totalExpense.toLocaleString()}원</h2>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl border shadow-sm whitespace-nowrap">
          <p className="text-[10px] md:text-sm text-slate-500 mb-1">저축/투자 <span className="hidden md:inline">(수입대비 {savingsRatio}%)</span></p>
          <h2 className="font-bold text-emerald-600 whitespace-nowrap tracking-tighter truncate text-xs md:text-2xl">{totalSavings.toLocaleString()}원</h2>
        </div>
      </div>

      {/* 4. 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <div className="bg-white p-2 md:p-4 rounded-xl border shadow-sm whitespace-nowrap">
          <div className="grid grid-cols-7 gap-1 text-center mb-1 md:mb-2 text-xs md:text-sm">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="font-bold text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: calendarDays[0].getDay()}).map((_, i) => <div key={'empty'+i} className="min-h-[60px] md:min-h-[80px]" />)}
            {calendarDays.map(day => {
              const dayTxs = monthlyTxs.filter(t => t.date && isSameDay(parseISO(t.date), day));
              const inc = dayTxs.filter(t => t.mainCategory === '수입').reduce((a,b) => a+Number(b.amount), 0);
              const exp = dayTxs.filter(t => t.mainCategory === '지출').reduce((a,b) => a+Number(b.amount), 0);
              const sav = dayTxs.filter(t => t.mainCategory === '저축' || t.mainCategory === '투자').reduce((a,b) => a+Number(b.amount), 0);
              
              return (
                <div key={day.toISOString()} 
                     onClick={() => { if(exp>0) setModalFilter({ type: 'date', value: day.toISOString() }) }}
                     className={`min-h-[60px] md:min-h-[80px] border rounded p-1 flex flex-col text-[10px] md:text-xs relative bg-slate-50 transition-colors ${exp > 0 ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-300' : ''}`}>
                  <span className="font-medium text-slate-700">{day.getDate()}</span>
                  <div className="mt-1 space-y-0.5 md:space-y-1">
                    {inc > 0 && <div className="text-blue-600 flex items-center gap-0.5 md:gap-1 font-medium"><span className="hidden md:block w-1 h-1 rounded-full bg-blue-600"></span>{inc.toLocaleString()}</div>}
                    {exp > 0 && <div className="text-red-600 flex items-center gap-0.5 md:gap-1 font-medium"><span className="hidden md:block w-1 h-1 rounded-full bg-red-600"></span>{exp.toLocaleString()}</div>}
                    {sav > 0 && <div className="text-emerald-600 flex items-center gap-0.5 md:gap-1 font-medium"><span className="hidden md:block w-1 h-1 rounded-full bg-emerald-600"></span>{sav.toLocaleString()}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5, 6. 월간 & 연간 뷰 공통 */}
      {(viewMode === 'monthly' || viewMode === 'yearly') && (
        <div className="space-y-4 md:space-y-6">
          {viewMode === 'yearly' && (
            <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm overflow-hidden">
              <h3 className="font-bold mb-4 text-sm md:text-base">{currentYear}년 월별 지출/수입/투자 흐름</h3>
              <div className="h-64 md:h-72 w-full ml-[-20px] md:ml-0">
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
                    <XAxis dataKey="month" style={{fontSize: 10}} />
                    <YAxis tickFormatter={v => (v/10000)+'만'} style={{fontSize: 10}} width={45} />
                    <Tooltip formatter={(v: any) => Number(v).toLocaleString()+'원'} />
                    <Bar dataKey="income" name="수입" fill="#3b82f6" barSize={12} />
                    <Bar dataKey="expense" name="지출" fill="#ef4444" barSize={12} />
                    <Line type="monotone" dataKey="savings" name="투자/저축" stroke="#22c55e" strokeWidth={2} dot={{r: 3}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold mb-4 text-sm md:text-base">{viewMode === 'yearly' ? '연간' : '월간'} 카테고리별 지출 비율</h3>
              <div className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={currentPieData.map(([name, value]) => ({name, value}))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8"
                      label={({name, percent}) => name + ' ' + ((percent || 0) * 100).toFixed(0) + '%'}
                      labelLine={false}
                      style={{ fontSize: '11px' }}
                      onClick={(data) => {
                        if(data && data.name) setModalFilter({ type: 'category', value: data.name });
                      }}
                      className="cursor-pointer"
                    >
                      {currentPieData.map((_, index) => (
                        <Cell key={'cell-' + index} fill={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][index % 7]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => Number(val || 0).toLocaleString() + '원'} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-[10px] md:text-xs text-slate-400 mt-2">차트 조각을 클릭하면 상세 내역을 볼 수 있습니다.</p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold mb-4 text-sm md:text-base">{viewMode === 'yearly' ? '연간' : '월간'} 결제수단별 지출 비용</h3>
              <div className="space-y-2 md:space-y-3">
                {Object.entries(currentExpenseByAccount).sort((a,b)=>b[1]-a[1]).map(([accId, amount]) => {
                  const ratio = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
                  return (
                    <div key={accId} 
                      className="flex justify-between items-center p-2 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                      onClick={() => setModalFilter({ type: 'account', value: accId })}>
                      <div>
                        <span className="font-medium text-slate-800 block text-sm md:text-base">{getAccountName(accId)}</span>
                        <span className="text-[10px] md:text-xs text-slate-400">지출 대비 {ratio}%</span>
                      </div>
                      <span className="font-bold text-red-600 text-sm md:text-base">{amount.toLocaleString()}원</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {modalFilter && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-4 md:p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm md:text-lg">{modalTitle} <span className="text-xs font-normal text-slate-500 ml-2">({viewMode === 'yearly' ? '연간' : '월간'})</span></h3>
              <button onClick={() => setModalFilter(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              
              {/* Desktop Table */}
              <table className="hidden md:table w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="p-3">날짜</th>
                    <th className="p-3">카테고리</th>
                    <th className="p-3">내역</th>
                    <th className="p-3 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModalTxs.map(t => (
                    <tr key={t.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => { setEditingTx(t); setIsTxModalOpen(true); }}>
                      <td className="p-3 text-slate-500">{t.date ? t.date.slice(5, 10) : ''}</td>
                      <td className="p-3">{t.subCategory || '기타'}</td>
                      <td className="p-3 text-slate-800">{t.merchant || t.memo}</td>
                      <td className="p-3 text-right font-bold text-red-600">{Number(t.amount).toLocaleString()}원</td>
                    </tr>
                  ))}
                  {filteredModalTxs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">결제 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex flex-col">
                {filteredModalTxs.map(t => (
                  <div key={t.id} className="border-b p-3 bg-white active:bg-slate-50 cursor-pointer" onClick={() => { setEditingTx(t); setIsTxModalOpen(true); }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{t.merchant || t.memo || '내역 없음'}</span>
                      <span className="font-bold text-red-600">{Number(t.amount).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>{t.date ? t.date.slice(5, 10) : ''} &middot; {t.subCategory || '기타'}</span>
                      <span>{t.mainCategory}</span>
                    </div>
                  </div>
                ))}
                {filteredModalTxs.length === 0 && (
                  <div className="p-8 text-center text-slate-400">결제 내역이 없습니다.</div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
