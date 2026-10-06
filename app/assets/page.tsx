'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const valuationHistory = [
  { date: '2026.01', valuation: 30000000 },
  { date: '2026.02', valuation: 32000000 },
  { date: '2026.03', valuation: 31500000 },
  { date: '2026.04', valuation: 35000000 },
  { date: '2026.05', valuation: 38000000 },
  { date: '2026.06', valuation: 45231000 },
];

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">자산 및 부채 포트폴리오</h1>
          <p className="text-sm text-slate-500 mt-1">계좌 잔액과 자산 평가액 변동 이력을 관리합니다.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
          <Plus size={16} /> 새 평가액 스냅샷 기록
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>총 자산 평가액 추이</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={valuationHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₩${(val/10000).toLocaleString()}만`} />
              <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="valuation" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* 계좌별 현황 테이블 뼈대 */}
      <Card>
        <CardHeader>
          <CardTitle>보유 계좌 / 자산 현황</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3">자산명 (금융기관)</th>
                  <th className="px-6 py-3">유형</th>
                  <th className="px-6 py-3 text-right">잔액/평가액</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">토스뱅크 모임통장</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">현금</span></td>
                  <td className="px-6 py-4 text-right font-semibold">₩ 2,500,000</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">KB증권 국내주식</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">투자</span></td>
                  <td className="px-6 py-4 text-right font-semibold">₩ 14,200,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
