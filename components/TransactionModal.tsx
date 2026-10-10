'use client';

import { useState, useEffect } from 'react';
import { Transaction, Account, CategoryItem } from '@/types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  accounts: Account[];
  categories: CategoryItem[];
}

export function TransactionModal({ isOpen, onClose, onSave, onDelete, initialData, accounts, categories }: Props) {
  
  const activeAccounts = accounts.filter(a => {
    if (!a.id || a.id === '0' || !a.name || String(a.name) === '0') return false;
    const bal = Number(a.balance);
    return !isNaN(bal) && bal !== 0 && String(a.balance) !== '' && a.balance !== null;
  });

  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString(),
    amount: 0,
    type: 'expense',
    merchant: '',
    mainCategory: '지출',
    subCategory: '',
    memo: '',
    fromAccountId: '',
    toAccountId: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        date: new Date().toISOString(),
        amount: 0,
        type: 'expense',
        merchant: '',
        mainCategory: '지출',
        subCategory: '',
        memo: '',
        fromAccountId: '',
        toAccountId: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const mainCategories = ['지출', '수입', '저축', '투자', '이동'];
  const filteredSubCats = categories.filter(c => c.mainCategory === formData.mainCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-assign transaction type
    let tType = 'expense';
    if (formData.mainCategory === '수입') tType = 'income';
    else if (formData.mainCategory === '저축') tType = 'savings';
    else if (formData.mainCategory === '투자') tType = 'investment';
    else if (formData.mainCategory === '이동') tType = 'transfer';

    onSave({
      ...formData,
      type: tType as any,
      id: formData.id || crypto.randomUUID(),
      isRecurring: formData.isRecurring || false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col justify-end sm:justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
        <div className="p-3 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="font-bold text-base">{initialData ? '거래 내역 수정' : '새 거래 내역 추가'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-black p-1">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto shrink">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            {mainCategories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({...formData, mainCategory: c as any, subCategory: ''})}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${formData.mainCategory === c ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">날짜/시간</label>
              <input type="datetime-local" className="w-full border rounded p-2 text-sm bg-white" 
                value={formData.date ? formData.date.slice(0,16) : ''} 
                onChange={e => setFormData({...formData, date: new Date(e.target.value).toISOString()})} required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">금액</label>
              <input type="number" className="w-full border rounded p-2 text-sm text-right bg-white font-bold text-slate-800" 
                value={formData.amount || ''} 
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">분류</label>
              <select className="w-full border rounded p-2 text-sm bg-white" required={formData.mainCategory !== '이동'}
                value={formData.subCategory}
                onChange={e => setFormData({...formData, subCategory: e.target.value})}>
                <option value="">선택</option>
                {filteredSubCats.map(c => <option key={c.id} value={c.subCategory}>{c.subCategory}</option>)}
                {formData.mainCategory === '이동' && <option value="계좌이체">계좌이체</option>}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">가맹점(내용)</label>
              <input type="text" className="w-full border rounded p-2 text-sm bg-white" 
                value={formData.merchant} 
                onChange={e => setFormData({...formData, merchant: e.target.value})} required={formData.mainCategory !== '이동'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(formData.mainCategory !== '수입') && (
              <div className={formData.mainCategory === '지출' ? "col-span-2" : "col-span-1"}>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">출금 계좌</label>
                <select className="w-full border rounded p-2 text-sm bg-white"
                  value={formData.fromAccountId || ''}
                  onChange={e => setFormData({...formData, fromAccountId: e.target.value})}>
                  <option value="">선택 안함</option>
                  {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {(formData.mainCategory === '수입' || formData.mainCategory === '저축' || formData.mainCategory === '투자' || formData.mainCategory === '이동') && (
              <div className={formData.mainCategory === '수입' ? "col-span-2" : "col-span-1"}>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">입금 계좌</label>
                <select className="w-full border rounded p-2 text-sm bg-white"
                  value={formData.toAccountId || ''}
                  onChange={e => setFormData({...formData, toAccountId: e.target.value})}>
                  <option value="">선택 안함</option>
                  {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <input type="text" placeholder="메모를 입력하세요 (선택)" className="w-full border rounded p-2 text-sm bg-white" 
              value={formData.memo} 
              onChange={e => setFormData({...formData, memo: e.target.value})} />
          </div>

          <div className="pt-3 pb-safe mt-2 flex justify-between items-center border-t shrink-0">
            {initialData && onDelete ? (
              <button type="button" onClick={() => onDelete(initialData.id)} className="text-red-500 hover:bg-red-50 font-bold px-3 py-2 rounded text-xs border border-red-100">
                삭제
              </button>
            ) : <div></div>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-xs font-bold bg-slate-50">취소</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded text-xs font-bold shadow-sm">저장</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
