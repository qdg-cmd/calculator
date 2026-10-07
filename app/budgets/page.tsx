'use client';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { parseISO, format } from 'date-fns';
import { Budget } from '@/types/finance';

export default function Budgets() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Budget>('Budgets');
  const { baseDay, periodType, selectedDate } = useDateStore();
  
  if (isLoading) return <div className="p-8 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;

  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);
  const currentMonthStr = format(new Date(selectedDate), 'yyyy-MM');
  const currentMonthNumStr = format(new Date(selectedDate), 'yyyy.MM');
  
  const handleAddBudget = () => {
    const catId = prompt('카테고리 ID를 입력하세요 (예: cat_ex_1):');
    if(!catId) return;
    const yearMonth = prompt('대상 연월을 입력하세요 (예: 2026-10):', currentMonthStr);
    const targetAmount = prompt('목표 예산 금액을 입력하세요:', '500000');
    // 임시 ID(b.id)를 추가하여 삭제할 수 있도록 함
    mutate.mutate({ action: 'CREATE', data: { id: 'B'+Date.now(), categoryId: catId, yearMonth: yearMonth || currentMonthStr, targetAmount: Number(targetAmount) || 0, warningThreshold: 80 } as any });
  };

  const handleDeleteBudget = (id: string) => {
    if(confirm('이 예산을 삭제하시겠습니까?')) mutate.mutate({ action: 'DELETE', data: { id } as any });
  };

  const budgets = data?.Budgets?.filter(b => {
    if (!b.yearMonth) return false;
    const yms = String(b.yearMonth);
    if (yms.includes('T')) return format(new Date(yms), 'yyyy-MM') === currentMonthStr;
    return yms.startsWith(currentMonthStr) || yms.startsWith(currentMonthNumStr) || yms === currentMonthStr.replace('-','');
  }) || [];
  
  const txs = data?.Transactions || [];
  const recurrings = data?.Recurring || [];

  const monthlyTxs = txs.filter(tx => {
    if (!tx.date) return false;
    const d = parseISO(tx.date);
    return d >= startDate && d <= endDate;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold">예산 및 고정 지출 ({format(new Date(selectedDate), 'MM월')})</h1>
        <p className="text-sm text-slate-500 mt-1">산정 기간: {format(startDate, 'yyyy.MM.dd')} ~ {format(endDate, 'yyyy.MM.dd')}</p>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">고정 지출 / 자동 이체 (Recurring)</h2>
        {recurrings.length === 0 ? (
          <div className="bg-slate-50 p-4 rounded-xl border text-center text-slate-500 text-sm">
            등록된 고정 지출이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recurrings.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-500">매월 {r.payDate}일</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{Number(r.amount).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">이번 달 예산 진행률</h2>
          <button onClick={handleAddBudget} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">+ 예산 추가</button>
        </div>
        {budgets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
            이번 달에 설정된 예산이 없습니다. <br/><span className="text-sm">(구글 시트의 Budgets 탭에 예산을 추가해주세요)</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {budgets.map(b => {
              const cat = data?.Categories?.find(c => c.id === b.categoryId);
              const spent = monthlyTxs.filter(t => t.subCategory === (cat?.subCategory || b.categoryId)).reduce((a,tx) => a+Number(tx.amount), 0);
              const target = Number(b.targetAmount);
              const ratio = target > 0 ? (spent / target) * 100 : 0;
              const warningThreshold = Number(b.warningThreshold || 80);
              const isWarning = ratio >= warningThreshold;
              // b as any allows us to read b.id if it exists
              const bId = (b as any).id || b.categoryId;
              
              return (
                <div key={bId} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-sm text-slate-500">{cat?.mainCategory || '지출'}</span>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{cat?.subCategory || b.categoryId}</h3>
                        <button onClick={() => handleDeleteBudget(bId)} className="text-red-400 text-xs hover:text-red-600">삭제</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${isWarning ? 'text-red-600' : 'text-slate-700'}`}>
                        {spent.toLocaleString()}원
                      </span>
                      <span className="text-sm text-slate-400"> / {target.toLocaleString()}원</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                    <div className={`h-full transition-all duration-500 ${ratio >= 100 ? 'bg-red-600' : isWarning ? 'bg-orange-500' : 'bg-blue-500'}`} 
                         style={{width: `${Math.min(ratio, 100)}%`}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-slate-500">
                      권장 임계값: {warningThreshold}%
                    </p>
                    <p className={`text-sm font-bold ${isWarning ? 'text-red-600' : 'text-blue-600'}`}>
                      {ratio.toFixed(1)}% 사용 {isWarning && ratio < 100 && '⚠️ 위험'} {ratio >= 100 && '🚨 초과'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  );
}
