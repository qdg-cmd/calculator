'use client';
import { useState } from 'react';
import { useAppData } from '@/lib/googleSheetsApi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, isSameDay } from 'date-fns';

export default function Dashboard() {
  const { data, isLoading, error } = useAppData();
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  if (isLoading) return <div className="p-8 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;
  if (error || !data) return <div className="p-8 text-red-500">오류가 발생했습니다. 다시 시도해주세요.</div>;

  const txs = data.Transactions || [];
  
  const currentYear = new Date().getFullYear();
  const filteredTxs = txs.filter(tx => {
    if (!tx.date) return false;
    const d = parseISO(tx.date);
    return d.getFullYear() === currentYear && d.getMonth() === selectedMonth;
  });

  const totalIncome = filteredTxs.filter(t => t.mainCategory === '수입').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = filteredTxs.filter(t => t.mainCategory === '지출').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalSavings = filteredTxs.filter(t => t.mainCategory === '저축' || t.mainCategory === '투자').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0;
  const savingsRatio = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0;

  const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
  const calendarDays = Array.from({length: daysInMonth}, (_, i) => new Date(currentYear, selectedMonth, i + 1));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex gap-2">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="border rounded px-3 py-1 bg-white"
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i} value={i}>{i + 1}월</option>
            ))}
          </select>
          <select 
            value={viewMode} 
            onChange={e => setViewMode(e.target.value)}
            className="border rounded px-3 py-1 bg-white"
          >
            <option value="monthly">월간 그래프</option>
            <option value="calendar">캘린더 뷰</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 mb-1">총 수입</p>
          <h2 className="text-2xl font-bold text-blue-600">{totalIncome.toLocaleString()}원</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 mb-1">총 지출 (지출률 {expenseRatio}%)</p>
          <h2 className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString()}원</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 mb-1">저축/투자 (저축률 {savingsRatio}%)</p>
          <h2 className="text-2xl font-bold text-emerald-600">{totalSavings.toLocaleString()}원</h2>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="font-bold text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: calendarDays[0].getDay()}).map((_, i) => <div key={'empty'+i} />)}
            {calendarDays.map(day => {
              const dayTxs = filteredTxs.filter(t => t.date && isSameDay(parseISO(t.date), day));
              const inc = dayTxs.filter(t => t.mainCategory === '수입').reduce((a,b) => a+Number(b.amount), 0);
              const exp = dayTxs.filter(t => t.mainCategory === '지출').reduce((a,b) => a+Number(b.amount), 0);
              const sav = dayTxs.filter(t => t.mainCategory === '저축' || t.mainCategory === '투자').reduce((a,b) => a+Number(b.amount), 0);
              
              return (
                <div key={day.toISOString()} className="min-h-[80px] border rounded p-1 flex flex-col text-xs relative">
                  <span className="font-medium">{day.getDate()}</span>
                  <div className="mt-1 space-y-1">
                    {inc > 0 && <div className="text-blue-600 bg-blue-50 rounded px-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>{inc.toLocaleString()}</div>}
                    {exp > 0 && <div className="text-red-600 bg-red-50 rounded px-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>{exp.toLocaleString()}</div>}
                    {sav > 0 && <div className="text-emerald-600 bg-emerald-50 rounded px-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{sav.toLocaleString()}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'monthly' && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">카테고리별 지출 비율</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={Object.entries(filteredTxs.filter(t => t.mainCategory === '지출').reduce((acc, t) => {
                    acc[t.subCategory || '기타'] = (acc[t.subCategory || '기타'] || 0) + Number(t.amount);
                    return acc;
                  }, {} as Record<string, number>)).map(([name, value]) => ({name, value}))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8"
                  label={({name, percent}) => name + ' (' + ((percent || 0) * 100).toFixed(0) + '%)'}
                >
                  {
                    Object.entries({}).map((_, index) => (
                      <Cell key={'cell-' + index} fill={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][index % 7]} />
                    ))
                  }
                </Pie>
                <Tooltip formatter={(val: any) => Number(val || 0).toLocaleString() + '원'} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
