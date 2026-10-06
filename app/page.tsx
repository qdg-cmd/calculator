'use client';

import { useDateStore } from '@/store/useDateStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 더미 데이터
const flowData = [
  { date: '10.17', income: 0, expense: 45000, savings: 0 },
  { date: '10.18', income: 0, expense: 12000, savings: 0 },
  { date: '10.19', income: 0, expense: 8000, savings: 0 },
  { date: '10.20', income: 3000000, expense: 50000, savings: 1000000 },
  { date: '10.21', income: 0, expense: 35000, savings: 0 },
];

const categoryData = [
  { name: '식비', value: 400 },
  { name: '교통비', value: 300 },
  { name: '여가', value: 300 },
  { name: '고정비', value: 200 },
];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { baseDay, isSalaryCycle, setBaseDay, toggleCycle, getPeriod } = useDateStore();
  const period = getPeriod();

  return (
    <div className="space-y-6">
      {/* 1. 상단 산정기준일 헤더 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">기준일:</label>
            <select 
              value={baseDay}
              onChange={(e) => setBaseDay(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm bg-slate-50"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}일</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={toggleCycle}
            className="text-sm px-3 py-1 rounded-full border bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            {isSalaryCycle ? '🔄 월급 주기 기준' : '📅 달력 기준 (1일~말일)'}
          </button>
        </div>

        <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
          조회 기간: {format(period.start, 'yyyy.MM.dd')} ~ {format(period.end, 'yyyy.MM.dd')}
        </div>
      </div>

      {/* 2. 핵심 KPI 카드 4종 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">총 순자산 (Net Worth)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩ 45,231,000</div>
            <p className="text-xs text-emerald-500 mt-1">+2.4% 지난 달 대비</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">당기 수입 & 저축액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩ 3,150,000</div>
            <p className="text-xs text-slate-500 mt-1">저축: ₩ 1,000,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">당기 지출 (예산 65%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩ 1,240,000</div>
            <div className="w-full bg-slate-100 h-2 mt-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[65%] rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">저축률 & 일평균 소비</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31.7%</div>
            <p className="text-xs text-slate-500 mt-1">하루 평균: ₩ 41,333</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. 차트 시각화 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 자산 흐름 시계열 차트 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>수입/지출 흐름 추이</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flowData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="수입" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="지출" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 카테고리 도넛 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>지출 카테고리 비중</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
