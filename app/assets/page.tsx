'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAssetValuations, useAccounts } from '@/lib/googleSheetsApi';
import { format, parseISO } from 'date-fns';

export default function AssetsPage() {
  const { data: valuations = [], isLoading: isValLoading } = useAssetValuations();
  const { data: accounts = [], isLoading: isAccLoading } = useAccounts();

  // 날짜순 정렬 후 차트용 데이터 포맷팅
  const chartData = [...valuations]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(v => ({
      date: format(typeof v.date === 'string' ? parseISO(v.date) : new Date(v.date), 'yyyy.MM.dd'),
      valuation: Number(v.valuation)
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">자산 및 부채 포트폴리오</h1>
          <p className="text-sm text-slate-500 mt-1">계좌 잔액과 자산 평가액 변동 이력을 관리합니다.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
          <Plus size={16} /> 새 평가액 스냅샷
        </button>
      </div>

      <Card>
        <CardHeader><CardTitle>총 자산 평가액 추이</CardTitle></CardHeader>
        <CardContent className="h-[400px]">
          {isValLoading ? (
            <div className="flex h-full items-center justify-center text-slate-500">데이터 불러오는 중...</div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₩${(val/10000).toLocaleString()}만`} />
                <Tooltip formatter={(value: any) => `₩${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="valuation" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">자산 평가 이력이 없습니다.</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>보유 계좌 / 자산 현황</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="px-6 py-3">자산명 (금융기관)</th><th className="px-6 py-3">유형</th><th className="px-6 py-3 text-right">잔액/평가액</th></tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {isAccLoading ? (
                  <tr><td colSpan={3} className="p-10 text-center text-slate-500">계좌 불러오는 중...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-slate-500">등록된 계좌가 없습니다.</td></tr>
                ) : accounts.map((acc, idx) => (
                  <tr key={acc.id || idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{acc.name} ({acc.institution})</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{acc.type}</span></td>
                    <td className="px-6 py-4 text-right font-semibold">₩ {Number(acc.balance).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
