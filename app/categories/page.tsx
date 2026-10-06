'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const TABS = ['지출', '수입', '저축', '투자'];

// 더미 초기 상태 (실제로는 API 연동)
const INITIAL_CATEGORIES = {
  '지출': ['고정비', '교통비', '생필품비', '식비', '자기개발', '여가', '꾸밈비', '의료', '관계비', '경조사비', '이벤트비', '기타1'],
  '수입': ['급여', '상여금', '부수입', '금융소득', '더치페이', '기타2'],
  '저축': ['청년미래적금', 'CMA', 'ISA', '미국투자', '주택청약', '기타3'],
  '투자': ['국내주식', '해외주식', '암호화폐', '채권/펀드', '부동산', '기타4']
};

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('지출');
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">카테고리 관리</h1>
          <p className="text-sm text-slate-500 mt-1">대분류별 소분류 항목을 추가하고 편집하세요.</p>
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
              activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories[activeTab as keyof typeof categories].map((sub, idx) => (
          <Card key={idx} className="group hover:border-blue-300 transition-colors">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-medium text-slate-700">{sub}</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                <button className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
