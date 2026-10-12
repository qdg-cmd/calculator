'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { useDateStore, getDateRange } from '@/store/useDateStore';
import { parseISO, format } from 'date-fns';
import { Budget } from '@/types/finance';
import { useModalBackHandler } from '@/lib/useModalBackHandler';

export default function Budgets() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Budget>('Budgets');
  const { baseDay, periodType, selectedDate } = useDateStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [catId, setCatId] = useState('');
  const [yearMonth, setYearMonth] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  useModalBackHandler(modalOpen, () => setModalOpen(false));

  if (isLoading) return <div className="p-8 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;

  const { startDate, endDate } = getDateRange(selectedDate, baseDay, periodType);
  const currentMonthStr = format(new Date(selectedDate), 'yyyy-MM');
  const currentMonthNumStr = format(new Date(selectedDate), 'yyyy.MM');

  const prevDate = new Date(selectedDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonthStr = format(prevDate, 'yyyy-MM');
  const prevMonthNumStr = format(prevDate, 'yyyy.MM');
  
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

  const prevBudgets = data?.Budgets?.filter(b => {
    if (!b.yearMonth) return false;
    const yms = String(b.yearMonth);
    if (yms.includes('T')) return format(new Date(yms), 'yyyy-MM') === prevMonthStr;
    return yms.startsWith(prevMonthStr) || yms.startsWith(prevMonthNumStr) || yms === prevMonthStr.replace('-','');
  }) || [];

  const handleCopyPreviousBudgets = () => {
    if (prevBudgets.length === 0) {
      alert(`지난달(${prevMonthStr})에 등록된 예산 데이터가 없습니다.`);
      return;
    }

    const existingCatIds = new Set(budgets.map(b => b.categoryId));
    const toAdd = prevBudgets.filter(pb => !existingCatIds.has(pb.categoryId));

    if (toAdd.length === 0) {
      alert('지난달 예산의 모든 카테고리가 이미 이번 달에 등록되어 있습니다.');
      return;
    }

    const confirmMsg = budgets.length > 0
      ? `이번 달에 이미 ${budgets.length}개의 예산이 있습니다.\n지난달(${prevMonthStr}) 예산 중 등록되지 않은 ${toAdd.length}개를 추가로 복사하시겠습니까?`
      : `지난달(${prevMonthStr})에 설정한 ${toAdd.length}개의 카테고리 예산을 이번 달(${currentMonthStr})로 복사하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    toAdd.forEach((pb, idx) => {
      mutate.mutate({
        action: 'CREATE',
        data: {
          id: 'B' + Date.now() + '_' + idx,
          categoryId: pb.categoryId,
          yearMonth: currentMonthStr,
          targetAmount: Number(pb.targetAmount),
          warningThreshold: Number(pb.warningThreshold) || 80
        } as any
      });
    });

    alert(`지난달 예산 ${toAdd.length}개가 이번 달(${currentMonthStr})로 복사되었습니다!`);
  };
  
  const txs = data?.Transactions || [];
  const recurrings = data?.Recurring || [];
  const categories = data?.Categories || [];

  const monthlyTxs = txs.filter(tx => {
    if (!tx.date) return false;
    const d = parseISO(tx.date);
    return d >= startDate && d <= endDate;
  });

  const totalTarget = budgets.reduce((a, b) => a + Number(b.targetAmount), 0);
  const totalSpent = budgets.reduce((a, b) => {
    const cat = categories.find(c => c.id === b.categoryId);
    const spent = monthlyTxs.filter(t => t.subCategory === (cat?.subCategory || b.categoryId)).reduce((sum, tx) => sum + Number(tx.amount), 0);
    return a + spent;
  }, 0);
  const totalRemaining = totalTarget - totalSpent;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      
      <div className="bg-white p-3 md:p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3 whitespace-nowrap">
        <div className="flex items-center justify-between gap-2 whitespace-nowrap">
          <button onClick={() => {
            const newD = new Date(selectedDate);
            newD.setMonth(newD.getMonth() - 1);
            useDateStore.getState().setSelectedDate(newD.toISOString());
          }} className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100">&lt;</button>
          <h1 className="font-bold text-base md:text-lg">예산 및 고정 지출 ({format(new Date(selectedDate), 'MM월')})</h1>
          <button onClick={() => {
            const newD = new Date(selectedDate);
            newD.setMonth(newD.getMonth() + 1);
            useDateStore.getState().setSelectedDate(newD.toISOString());
          }} className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100">&gt;</button>
        </div>
        <p className="text-xs md:text-sm text-slate-500 text-center md:text-right">
          산정 기간: {format(startDate, 'yyyy.MM.dd')} ~ {format(endDate, 'yyyy.MM.dd')}
        </p>
      </div>


      <section>
        <h2 className="text-base md:text-lg font-bold mb-3">고정 지출 / 자동 이체 (Recurring)</h2>
        {recurrings.length === 0 ? (
          <div className="bg-slate-50 p-4 rounded-xl border text-center text-slate-500 text-sm">
            등록된 고정 지출이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 whitespace-nowrap">
            {recurrings.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-500">매월 {r.payDate}일</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="font-bold text-blue-600">{Number(r.amount).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-bold">이번 달 예산 진행률</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyPreviousBudgets} 
              className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-sm"
              title={`지난달(${prevMonthStr}) 예산을 이번 달(${currentMonthStr})로 복사합니다`}
            >
              📋 지난달 예산 복사
            </button>
            <button onClick={() => handleOpenModal()} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">+ 예산 추가</button>
          </div>
        </div>
        {budgets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border text-center text-slate-500 space-y-3">
            <p className="font-medium text-slate-700">이번 달에 설정된 예산이 없습니다.</p>
            {prevBudgets.length > 0 ? (
              <div>
                <button 
                  onClick={handleCopyPreviousBudgets} 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                >
                  📋 지난달({prevMonthStr}) 예산 {prevBudgets.length}개 이번 달로 가져오기
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">(상단의 '+ 예산 추가' 버튼을 눌러 예산을 등록해주세요)</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 전체 예산 한도 요약 배너 */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 md:p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs text-indigo-200 font-medium mb-1">이번 달 총 예산 한도 대비 잔여액</p>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl md:text-3xl font-extrabold tracking-tight">
                    {totalRemaining >= 0 ? `${totalRemaining.toLocaleString()}원 남음` : `${Math.abs(totalRemaining).toLocaleString()}원 초과!`}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${totalRemaining >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {totalTarget > 0 ? `${((totalSpent / totalTarget) * 100).toFixed(1)}% 사용` : '0%'}
                  </span>
                </div>
              </div>
              <div className="flex gap-5 md:gap-6 text-xs md:text-sm text-slate-300 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                <div>
                  <p className="text-[11px] text-slate-400">총 목표 예산</p>
                  <p className="font-bold text-white text-sm md:text-base">{totalTarget.toLocaleString()}원</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">사용한 금액</p>
                  <p className="font-bold text-red-300 text-sm md:text-base">{totalSpent.toLocaleString()}원</p>
                </div>
              </div>
            </div>

            {/* 개별 카테고리 예산 그리드 */}
            <div className="grid gap-4 md:grid-cols-2">
              {budgets.map(b => {
                const cat = categories.find(c => c.id === b.categoryId);
                const spent = monthlyTxs.filter(t => t.subCategory === (cat?.subCategory || b.categoryId)).reduce((a,tx) => a+Number(tx.amount), 0);
                const target = Number(b.targetAmount);
                const remaining = target - spent;
                const ratio = target > 0 ? (spent / target) * 100 : 0;
                const warningThreshold = Number(b.warningThreshold || 80);
                const isWarning = ratio >= warningThreshold;
                const bId = (b as any).id || b.categoryId;
                
                return (
                  <div key={bId} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-sm text-slate-500">{cat?.mainCategory || '지출'}</span>
                        <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                          <h3 className="font-bold text-base md:text-lg">{cat?.subCategory || b.categoryId}</h3>
                          <button onClick={() => handleOpenModal(b)} className="text-blue-400 text-xs hover:text-blue-600 border border-blue-200 px-2 py-0.5 rounded">수정</button>
                          <button onClick={() => handleDeleteBudget(bId)} className="text-red-400 text-xs hover:text-red-600 border border-red-200 px-2 py-0.5 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className={`text-base md:text-lg font-bold ${isWarning ? 'text-red-600' : 'text-slate-700'}`}>
                          {spent.toLocaleString()}원
                        </span>
                        <span className="text-sm text-slate-400"> / {target.toLocaleString()}원</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          잔여: <span className={remaining >= 0 ? 'text-indigo-600 font-bold' : 'text-red-600 font-bold'}>
                            {remaining >= 0 ? `${remaining.toLocaleString()}원 남음` : `${Math.abs(remaining).toLocaleString()}원 초과`}
                          </span>
                        </p>
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
          </div>
        )}
      </section>

      {/* Budget Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base md:text-lg">{editBudget ? '예산 수정' : '새 예산 추가'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">예산 대상 카테고리</label>
                <select 
                  className="w-full border rounded-lg p-2 bg-slate-50 whitespace-nowrap"
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
                  className="w-full border rounded-lg p-2 bg-slate-50 whitespace-nowrap" 
                  value={yearMonth} 
                  onChange={(e) => setYearMonth(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">목표 예산 금액</label>
                <input 
                  type="number" 
                  className="w-full border rounded-lg p-2 bg-slate-50 font-bold text-blue-600 whitespace-nowrap" 
                  value={targetAmount} 
                  onChange={(e) => setTargetAmount(e.target.value)} 
                />
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2 whitespace-nowrap">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">취소</button>
              <button onClick={handleSaveBudget} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold shadow-sm hover:bg-slate-700 transition-colors">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
