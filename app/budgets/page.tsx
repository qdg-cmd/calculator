'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { parseISO, format } from 'date-fns';
import { Budget } from '@/types/finance';

export default function Budgets() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Budget>('Budgets');
  const { baseDay, periodType, selectedDate } = useDateStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [catId, setCatId] = useState('');
  const [yearMonth, setYearMonth] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  if (isLoading) return <div className="p-8 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;

  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);
  const currentMonthStr = format(new Date(selectedDate), 'yyyy-MM');
  const currentMonthNumStr = format(new Date(selectedDate), 'yyyy.MM');
  
  const handleOpenModal = (budget?: any) => {
    if (budget) {
      setEditBudget(budget);
      setCatId(budget.categoryId);
      setYearMonth(budget.yearMonth);
      setTargetAmount(String(budget.targetAmount));
    } else {
      setEditBudget(null);
      setCatId('');
      setYearMonth(currentMonthStr);
      setTargetAmount('');
    }
    setModalOpen(true);
  };

  const handleSaveBudget = () => {
    if (!catId) return alert('카테고리를 선택해주세요.');
    if (!yearMonth) return alert('대상 연월을 입력해주세요.');
    if (!targetAmount) return alert('목표 예산 금액을 입력해주세요.');
    
    if (editBudget) {
      mutate.mutate({ 
        action: 'UPDATE', 
        data: { ...editBudget, categoryId: catId, yearMonth, targetAmount: Number(targetAmount) }
      });
    } else {
      mutate.mutate({ 
        action: 'CREATE', 
        data: { id: 'B'+Date.now(), categoryId: catId, yearMonth, targetAmount: Number(targetAmount), warningThreshold: 80 } as any 
      });
    }
    setModalOpen(false);
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
  const categories = data?.Categories || [];

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
          <button onClick={() => handleOpenModal()} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">+ 예산 추가</button>
        </div>
        {budgets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
            이번 달에 설정된 예산이 없습니다. <br/><span className="text-sm">(구글 시트의 Budgets 탭에 예산을 추가해주세요)</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {budgets.map(b => {
              const cat = categories.find(c => c.id === b.categoryId);
              const spent = monthlyTxs.filter(t => t.subCategory === (cat?.subCategory || b.categoryId)).reduce((a,tx) => a+Number(tx.amount), 0);
              const target = Number(b.targetAmount);
              const ratio = target > 0 ? (spent / target) * 100 : 0;
              const warningThreshold = Number(b.warningThreshold || 80);
              const isWarning = ratio >= warningThreshold;
              const bId = (b as any).id || b.categoryId;
              
              return (
                <div key={bId} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-sm text-slate-500">{cat?.mainCategory || '지출'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <h3 className="font-bold text-lg">{cat?.subCategory || b.categoryId}</h3>
                        <button onClick={() => handleOpenModal(b)} className="text-blue-400 text-xs hover:text-blue-600 border border-blue-200 px-2 py-0.5 rounded">수정</button>
                        <button onClick={() => handleDeleteBudget(bId)} className="text-red-400 text-xs hover:text-red-600 border border-red-200 px-2 py-0.5 rounded">삭제</button>
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
                    <p className="text-xs text-slate-500">권장 임계값: {warningThreshold}%</p>
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

      {/* Budget Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">{editBudget ? '예산 수정' : '새 예산 추가'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">예산 대상 카테고리</label>
                <select 
                  className="w-full border rounded-lg p-2 bg-slate-50"
                  value={catId} 
                  onChange={(e) => setCatId(e.target.value)}
                >
                  <option value="">-- 카테고리 선택 --</option>
                  {categories.filter(c => c.mainCategory === '지출').map(c => (
                    <option key={c.id} value={c.id}>{c.mainCategory} &gt; {c.subCategory}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">대상 연월 (YYYY-MM)</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 bg-slate-50" 
                  value={yearMonth} 
                  onChange={(e) => setYearMonth(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">목표 예산 금액</label>
                <input 
                  type="number" 
                  className="w-full border rounded-lg p-2 bg-slate-50 font-bold text-blue-600" 
                  value={targetAmount} 
                  onChange={(e) => setTargetAmount(e.target.value)} 
                />
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">취소</button>
              <button onClick={handleSaveBudget} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold shadow-sm hover:bg-slate-700 transition-colors">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
