'use client';
import { useState } from 'react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { parseISO, format } from 'date-fns';
import { Transaction } from '@/types/finance';
import { TransactionModal } from '@/components/TransactionModal';

export default function Transactions() {
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<Transaction>('Transactions');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // 일괄 수정(미분류 모아보기) 모드 상태
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState({ main: '지출', sub: '' });
  const [bulkAccount, setBulkAccount] = useState('');

  if (isLoading) return <div className="p-8">로딩 중...</div>;
  const txs = data?.Transactions || [];
  const accounts = data?.Accounts || [];
  const categories = data?.Categories || [];
  
  // 일반 검색 필터
  let filtered = txs.filter(t => 
    t.mainCategory?.includes(search) ||
    t.merchant?.includes(search) || 
    t.subCategory?.includes(search) || 
    t.memo?.includes(search) || 
    String(t.amount).includes(search) ||
    (t.date && format(parseISO(t.date), 'yyyy-MM-dd').includes(search))
  );

  // 미분류 모드일 땐 미분류만 보여주기
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">거래 내역</h1>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${bulkMode ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border-indigo-600'}`}
            onClick={() => { setBulkMode(!bulkMode); setSelectedTxIds([]); }}>
            {bulkMode ? '일괄 수정 모드 종료' : '미분류 일괄 수정'}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700" 
            onClick={() => { setEditingTx(null); setIsModalOpen(true); }}>
            + 새 거래 추가
          </button>
        </div>
      </div>
      
      {!bulkMode && (
        <input type="text" placeholder="일시, 금액, 분류, 가맹점 등으로 검색..." 
          className="w-full border rounded-lg p-3 text-sm shadow-sm" 
          value={search} onChange={e => setSearch(e.target.value)} />
      )}

      {bulkMode && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-indigo-800 mb-1 font-bold">일괄 변경할 카테고리</label>
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
          <div className="flex-1 w-full">
            <label className="block text-xs text-indigo-800 mb-1 font-bold">일괄 변경할 결제수단</label>
            <select className="w-full border rounded p-2 text-sm bg-white" value={bulkAccount} onChange={e => setBulkAccount(e.target.value)}>
              <option value="">변경 안함</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>)}
            </select>
          </div>
          <button onClick={handleBulkUpdate} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 w-full md:w-auto h-[38px]">
            {selectedTxIds.length}개 일괄 적용
          </button>
        </div>
      )}
        
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b">
            <tr>
              {bulkMode && (
                <th className="p-3 w-10 text-center">
                  <input type="checkbox" onChange={e => {
                    if (e.target.checked) setSelectedTxIds(filtered.map(t => t.id));
                    else setSelectedTxIds([]);
                  }} checked={filtered.length > 0 && selectedTxIds.length === filtered.length} />
                </th>
              )}
              <th className="p-3">일시</th>
              <th className="p-3">분류</th>
              <th className="p-3">결제수단</th>
              <th className="p-3">가맹점(내용)</th>
              <th className="p-3 text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className={`border-b transition-colors ${selectedTxIds.includes(t.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'} ${bulkMode ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => { if (!bulkMode) { setEditingTx(t); setIsModalOpen(true); } }}>
                {bulkMode && (
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={selectedTxIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                )}
                <td className="p-3">{t.date ? format(parseISO(t.date), 'MM.dd HH:mm') : ''}</td>
                <td className="p-3">
                  {t.mainCategory === '미분류' ? <span className="text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded">미분류</span> : `${t.mainCategory} > ${t.subCategory}`}
                </td>
                <td className="p-3 text-slate-500">{getAccountName(t.fromAccountId)}</td>
                <td className="p-3">
                  <div className="font-medium">{t.merchant}</div>
                  {t.memo && <div className="text-xs text-slate-400 mt-0.5">{t.memo}</div>}
                </td>
                <td className={'p-3 font-medium text-right ' + 
                  (t.mainCategory === '수입' ? 'text-blue-600' : 
                   t.mainCategory === '지출' ? 'text-red-600' : 
                   'text-emerald-600')}>
                  {t.mainCategory === '지출' ? '-' : '+'}{Number(t.amount).toLocaleString()}원
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={bulkMode ? 6 : 5} className="p-8 text-center text-slate-400">내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        initialData={editingTx}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
