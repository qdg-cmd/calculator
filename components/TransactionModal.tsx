import { useState, useEffect } from 'react';
import { Transaction, Account, CategoryItem } from '@/types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  initialData?: Transaction | null;
  accounts: Account[];
  categories: CategoryItem[];
}

export function TransactionModal({ isOpen, onClose, onSave, initialData, accounts, categories }: Props) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">{initialData ? '거래 내역 수정' : '새 거래 내역 추가'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-black">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">날짜/시간</label>
              <input type="datetime-local" className="w-full border rounded p-2 text-sm" 
                value={formData.date ? formData.date.slice(0,16) : ''} 
                onChange={e => setFormData({...formData, date: new Date(e.target.value).toISOString()})} required />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">금액</label>
              <input type="number" className="w-full border rounded p-2 text-sm text-right" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">대분류</label>
              <select className="w-full border rounded p-2 text-sm"
                value={formData.mainCategory}
                onChange={e => setFormData({...formData, mainCategory: e.target.value as any, subCategory: ''})}>
                {mainCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">소분류</label>
              <select className="w-full border rounded p-2 text-sm" required={formData.mainCategory !== '이동'}
                value={formData.subCategory}
                onChange={e => setFormData({...formData, subCategory: e.target.value})}>
                <option value="">선택하세요</option>
                {filteredSubCats.map(c => <option key={c.id} value={c.subCategory}>{c.subCategory}</option>)}
                {formData.mainCategory === '이동' && <option value="계좌이체">계좌이체</option>}
              </select>
            </div>
          </div>

          {(formData.mainCategory !== '수입') && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">출금 계좌</label>
              <select className="w-full border rounded p-2 text-sm"
                value={formData.fromAccountId || ''}
                onChange={e => setFormData({...formData, fromAccountId: e.target.value})}>
                <option value="">선택 안함</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>)}
              </select>
            </div>
          )}

          {(formData.mainCategory === '수입' || formData.mainCategory === '저축' || formData.mainCategory === '투자' || formData.mainCategory === '이동') && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">입금 계좌</label>
              <select className="w-full border rounded p-2 text-sm"
                value={formData.toAccountId || ''}
                onChange={e => setFormData({...formData, toAccountId: e.target.value})}>
                <option value="">선택 안함</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-500 mb-1">내역/사용처</label>
            <input type="text" className="w-full border rounded p-2 text-sm" 
              value={formData.merchant} 
              onChange={e => setFormData({...formData, merchant: e.target.value})} required={formData.mainCategory !== '이동'} />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">메모</label>
            <input type="text" className="w-full border rounded p-2 text-sm" 
              value={formData.memo} 
              onChange={e => setFormData({...formData, memo: e.target.value})} />
          </div>

          <div className="pt-4 flex gap-2 justify-end border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}
