'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppData, useOptimisticMutation } from '@/lib/googleSheetsApi';
import { CategoryItem } from '@/types/finance';

const TABS = ['지출', '수입', '저축', '투자'];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('지출');
  const { data, isLoading } = useAppData();
  const mutate = useOptimisticMutation<CategoryItem>('Categories');
  const categories = data?.Categories || [];

  const currentSubCats = categories.filter(c => c.mainCategory === activeTab);

  const handleAdd = () => {
    const subCat = prompt(`${activeTab}의 새로운 소분류 이름을 입력하세요:`);
    if (subCat && subCat.trim() !== '') {
      mutate.mutate({
        action: 'CREATE',
        data: {
          id: crypto.randomUUID(),
          mainCategory: activeTab as any,
          subCategory: subCat.trim()
        }
      });
    }
  };

  const handleEdit = (cat: CategoryItem) => {
    const newSubCat = prompt('소분류 이름을 수정하세요:', cat.subCategory);
    if (newSubCat && newSubCat.trim() !== '' && newSubCat !== cat.subCategory) {
      mutate.mutate({
        action: 'UPDATE',
        data: { ...cat, subCategory: newSubCat.trim() }
      });
    }
  };

  const handleDelete = (cat: CategoryItem) => {
    if (confirm(`'${cat.subCategory}' 카테고리를 정말 삭제하시겠습니까?`)) {
      mutate.mutate({
        action: 'DELETE',
        data: { id: cat.id }
      });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">카테고리 관리</h1>
          <p className="text-sm text-slate-500 mt-1">대분류 및 소분류를 추가하고 편집하세요.</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap">
          <Plus size={16} /> 소분류 추가
        </button>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-slate-500">카테고리 불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentSubCats.map((sub) => (
            <Card key={sub.id} className="group hover:border-blue-300 transition-colors">
              <CardContent className="p-4 flex justify-between items-center">
                <span className="font-medium text-slate-700">{sub.subCategory}</span>
                <div className="flex gap-2 whitespace-nowrap">
                  <button onClick={() => handleEdit(sub)} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(sub)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                </div>
              </CardContent>
            </Card>
          ))}
          {currentSubCats.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-400 border-2 border-dashed rounded-xl">
              등록된 소분류가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
