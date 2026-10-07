'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppData } from '@/lib/googleSheetsApi';

const TABS = ['지출', '수입', '저축', '투자'];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('지출');
  const { data, isLoading } = useAppData();
  const categories = data?.Categories || [];

  const currentSubCats = categories.filter(c => c.mainCategory === activeTab);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">카테고리 관리</h1>
          <p className="text-sm text-slate-500 mt-1">대분류 및 소분류를 추가하고 편집하세요.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
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
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                  <button className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
