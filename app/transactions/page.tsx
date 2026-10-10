'use client';

import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { Transaction } from '@/types/finance';
import { format, parseISO } from 'date-fns';
import { TransactionModal } from '@/components/TransactionModal';

export default function TransactionsPage() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Transaction>('Transactions');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState({ main: '지출', sub: '' });
  const [bulkAccount, setBulkAccount] = useState('');

  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const txs = data?.Transactions || [];
  const accounts = data?.Accounts || [];
  const activeAccounts = accounts.filter(a => {
    if (!a.id || a.id === '0' || !a.name || String(a.name) === '0') return false;
    const bal = Number(a.balance);
    return !isNaN(bal) && bal !== 0 && String(a.balance) !== '' && a.balance !== null;
  });
  const categories = data?.Categories || [];

  let filtered = txs.filter(t => 
    (t.merchant || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.memo || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.mainCategory || '').includes(search) ||
    (t.subCategory || '').includes(search)
  );

  if (bulkMode) {
    filtered = filtered.filter(t => t.mainCategory === '미분류' || !t.subCategory || t.subCategory === '미분류');
  }

  filtered.sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const handleSave = (tx: Partial<Transaction>) => {
    if (editingTx) {
      mutate.mutate({ action: 'UPDATE', data: tx });
    } else {
      mutate.mutate({ action: 'CREATE', data: tx });
    }
  };

  const getAccountName = (accId?: string) => {
    if (!accId) return '-';
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.institution : accId;
  };

  const toggleSelect = (id: string) => {
    if (selectedTxIds.includes(id)) setSelectedTxIds(selectedTxIds.filter(x => x !== id));
    else setSelectedTxIds([...selectedTxIds, id]);
  };

  const handleBulkUpdate = () => {
    if (selectedTxIds.length === 0) return alert('선택된 내역이 없습니다.');
    if (!bulkCategory.sub && !bulkAccount) return alert('변경할 카테고리나 결제수단을 선택해주세요.');
    
    selectedTxIds.forEach(id => {
      const tx = txs.find(t => t.id === id);
      if (tx) {
        mutate.mutate({
          action: 'UPDATE',
          data: {
            ...tx,
            mainCategory: bulkCategory.sub ? bulkCategory.main : tx.mainCategory,
            subCategory: bulkCategory.sub ? bulkCategory.sub : tx.subCategory,
            fromAccountId: bulkAccount ? bulkAccount : tx.fromAccountId
          }
        });
      }
    });
    setSelectedTxIds([]);
    alert('일괄 수정이 완료되었습니다.');
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">거래 내역</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <button 
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${bulkMode ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border-indigo-600'}`}
            onClick={() => { setBulkMode(!bulkMode); setSelectedTxIds([]); }}>
            {bulkMode ? '모드 종료' : '미분류 일괄 수정'}
          </button>
          <button className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700" 
            onClick={() => { setEditingTx(null); setIsModalOpen(true); }}>
            + 거래 추가
          </button>
        </div>
      </div>
      
      {!bulkMode && (
        <input type="text" placeholder="일시, 금액, 분류, 가맹점 등으로 검색..." 
          className="w-full border rounded-lg p-3 text-sm shadow-sm" 
          value={search} onChange={e => setSearch(e.target.value)} />
      )}

      {bulkMode && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col gap-4">
          <div>
            <label className="block text-xs text-indigo-800 mb-1 font-bold">변경할 카테고리</label>
            <div className="flex gap-2">
              <select className="border rounded p-2 text-sm w-1/3 bg-white" value={bulkCategory.main} onChange={e => setBulkCategory({...bulkCategory, main: e.target.value, sub: ''})}>
                {['지출', '수입'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="border rounded p-2 text-sm w-2/3 bg-white" value={bulkCategory.sub} onChange={e => setBulkCategory({...bulkCategory, sub: e.target.value})}>
                <option value="">변경 안함</option>
                {categories.filter(c => c.mainCategory === bulkCategory.main).map(c => <option key={c.id} value={c.subCategory}>{c.subCategory}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-indigo-800 mb-1 font-bold">변경할 결제수단</label>
            <select className="w-full border rounded p-2 text-sm bg-white" value={bulkAccount} onChange={e => setBulkAccount(e.target.value)}>
              <option value="">변경 안함</option>
              {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>)}
            </select>
          </div>
          <button onClick={handleBulkUpdate} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 w-full mt-2 h-[44px]">
            {selectedTxIds.length}개 일괄 적용
          </button>
        </div>
      )}
        
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {bulkMode && (
           <div className="p-3 border-b bg-slate-50 flex items-center gap-2">
             <input type="checkbox" className="w-5 h-5 rounded border-gray-300"
                onChange={e => {
                  if (e.target.checked) setSelectedTxIds(filtered.map(t => t.id));
                  else setSelectedTxIds([]);
                }} checked={filtered.length > 0 && selectedTxIds.length === filtered.length} />
             <span className="text-sm font-bold text-slate-700">전체 선택</span>
           </div>
        )}
        <div className="flex flex-col">
          {filtered.map(t => (
            <div key={t.id} 
              onClick={(e) => { 
  if (bulkMode) { 
    toggleSelect(t.id); 
  } else { 
    setEditingTx(t); 
    setIsModalOpen(true); 
  } 
}}
              className={`border-b p-4 flex items-center justify-between transition-colors cursor-pointer active:bg-slate-100 hover:bg-slate-50 ${selectedTxIds.includes(t.id) ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {bulkMode && (
                  <input type="checkbox" checked={selectedTxIds.includes(t.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(t.id); }} className="w-6 h-6 rounded border-gray-300 flex-shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">{t.merchant}</span>
                    {t.mainCategory === '미분류' && <span className="text-[10px] text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded flex-shrink-0">미분류</span>}
                  </div>
                  <span className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-[250px]">{t.memo}</span>
                  <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span>{t.date ? format(parseISO(t.date), 'MM.dd HH:mm') : ''}</span>
                    <span>·</span>
                    <span className="truncate">{getAccountName(t.fromAccountId)}</span>
                    {t.mainCategory !== '미분류' && (
                      <>
                        <span>·</span>
                        <span className="truncate">{t.subCategory}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                <span className={`font-bold ${t.mainCategory === '수입' ? 'text-blue-600' : t.mainCategory === '지출' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {t.mainCategory === '지출' ? '-' : '+'}{Number(t.amount).toLocaleString()}원
                </span>
                {!bulkMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (confirm('정말 삭제하시겠습니까?')) { mutate.mutate({ action: 'DELETE', data: { id: t.id } }); } }} 
                    className="text-[11px] text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-1 rounded active:bg-red-200">
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-400">내역이 없습니다.</div>
          )}
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        initialData={editingTx}
        accounts={accounts}
        categories={categories}
        onDelete={(id) => {
          mutate.mutate({ action: 'DELETE', data: { id } });
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
