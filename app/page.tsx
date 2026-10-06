'use client';

import { useState } from 'react';
import { useDateStore } from '@/store/useDateStore';
import { useTransactions, useAssetValuations } from '@/lib/googleSheetsApi';
import { format, isWithinInterval, startOfYear, endOfYear, getMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const { baseDay, isSalaryCycle, setBaseDay, toggleCycle, getPeriod } = useDateStore();
  
  const period = getPeriod();
  const { data: transactions = [], isLoading: isTxLoading } = useTransactions();
  const { data: valuations = [] } = useAssetValuations();

  // ---------------- [월간 데이터 필터링] ----------------
  const monthlyTx = transactions.filter(tx => {
    try {
      const date = typeof tx.date === 'string' ? parseISO(tx.date) : new Date(tx.date);
      return isWithinInterval(date, { start: period.start, end: period.end });
    } catch { return false; }
  });

  const mIncome = monthlyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const mExpense = monthlyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const mSavings = monthlyTx.filter(t => t.type === 'savings' || t.type === 'investment').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const mSavingsRate = mIncome > 0 ? ((mSavings / mIncome) * 100).toFixed(1) : '0.0';

  // 카테고리별 지출 통계 (도넛 차트용)
  const categoryMap: Record<string, number> = {};
  monthlyTx.filter(t => t.type === 'expense').forEach(t => {
    categoryMap[t.subCategory] = (categoryMap[t.subCategory] || 0) + Number(t.amount);
  });
  const mCategoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  // 일자별 수입/지출 (라인 차트용)
  const daysInPeriod = Array.from({ length: period.end.getDate() - period.start.getDate() + 1 }, (_, i) => {
    const d = new Date(period.start);
    d.setDate(d.getDate() + i);
    return format(d, 'MM.dd');
  });
  
  const mFlowMap: Record<string, any> = {};
  daysInPeriod.forEach(d => mFlowMap[d] = { date: d, income: 0, expense: 0 });
  monthlyTx.forEach(t => {
    try {
      const d = format(typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date), 'MM.dd');
      if (mFlowMap[d]) {
        if (t.type === 'income') mFlowMap[d].income += Number(t.amount);
        if (t.type === 'expense') mFlowMap[d].expense += Number(t.amount);
      }
    } catch {}
  });
  const mFlowData = Object.values(mFlowMap);

  // ---------------- [연간 데이터 필터링] ----------------
  const currentYear = new Date().getFullYear();
  const yearlyTx = transactions.filter(tx => {
    try {
      const date = typeof tx.date === 'string' ? parseISO(tx.date) : new Date(tx.date);
      return date.getFullYear() === currentYear;
    } catch { return false; }
  });

  const yIncome = yearlyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const yExpense = yearlyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const ySavings = yearlyTx.filter(t => t.type === 'savings' || t.type === 'investment').reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // 월별 수입/지출 통계 (바 차트용)
  const yMonthlyMap: Record<number, any> = {};
  for(let i=0; i<12; i++) yMonthlyMap[i] = { month: `${i+1}월`, income: 0, expense: 0, savings: 0 };
  
  yearlyTx.forEach(t => {
    try {
      const m = getMonth(typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date));
      if (t.type === 'income') yMonthlyMap[m].income += Number(t.amount);
      if (t.type === 'expense') yMonthlyMap[m].expense += Number(t.amount);
      if (t.type === 'savings' || t.type === 'investment') yMonthlyMap[m].savings += Number(t.amount);
    } catch {}
  });
  const yMonthlyData = Object.values(yMonthlyMap);

  if (isTxLoading) return <div className="p-10 text-center text-slate-500">구글 시트에서 데이터를 불러오는 중입니다...</div>;

  return (
    <div className="space-y-6">
      {/* 탭 스위치 및 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-200 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setViewMode('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            월간 요약
          </button>
          <button 
            onClick={() => setViewMode('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            연간 요약
          </button>
        </div>
        
        {viewMode === 'monthly' && (
          <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">기준일:</label>
              <select value={baseDay} onChange={(e) => setBaseDay(Number(e.target.value))} className="border rounded-md px-2 py-1 text-sm bg-slate-50 outline-none">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}일</option>)}
              </select>
            </div>
            <button onClick={toggleCycle} className="text-sm px-3 py-1 rounded-full border bg-slate-50 hover:bg-slate-100">
              {isSalaryCycle ? '🔄 월급 주기' : '📅 달력 기준'}
            </button>
            <div className="text-sm font-semibold text-blue-600">
              {format(period.start, 'MM.dd')} ~ {format(period.end, 'MM.dd')}
            </div>
          </div>
        )}
      </div>

      {/* ===================== [ 월간 대시보드 ] ===================== */}
      {viewMode === 'monthly' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="text-sm text-slate-500">당기 수입</div><div className="text-2xl font-bold text-blue-600">₩ {mIncome.toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-sm text-slate-500">당기 지출</div><div className="text-2xl font-bold text-red-500">₩ {mExpense.toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-sm text-slate-500">저축 & 투자 (저축률 {mSavingsRate}%)</div><div className="text-2xl font-bold text-emerald-500">₩ {mSavings.toLocaleString()}</div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>일자별 수입/지출 흐름</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mFlowData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tickFormatter={(val) => `${val/10000}만`} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value: any) => `₩ ${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="수입" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expense" name="지출" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>지출 카테고리 비중</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {mCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                        {mCategoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₩ ${Number(value).toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">지출 내역이 없습니다.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ===================== [ 연간 대시보드 ] ===================== */}
      {viewMode === 'yearly' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="text-sm text-slate-500">{currentYear}년 총 수입</div><div className="text-2xl font-bold text-blue-600">₩ {yIncome.toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-sm text-slate-500">{currentYear}년 총 지출</div><div className="text-2xl font-bold text-red-500">₩ {yExpense.toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-sm text-slate-500">{currentYear}년 총 저축/투자</div><div className="text-2xl font-bold text-emerald-500">₩ {ySavings.toLocaleString()}</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>{currentYear}년 월별 수입/지출/저축 요약</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(val) => `${val/10000}만`} />
                  <Tooltip formatter={(value: any) => `₩ ${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income" name="수입" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="지출" fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="savings" name="저축" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
