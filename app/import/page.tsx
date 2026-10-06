'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ImportWizardPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">데이터 수입(Import) 위저드</h1>
        <p className="text-sm text-slate-500 mt-1">은행 및 카드사 명세서(CSV/Excel)를 안전하게 DB로 이관합니다.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }}></div>
        
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex flex-col items-center gap-2 bg-slate-50 px-2`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= i ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > i ? <CheckCircle2 size={16} /> : i}
            </div>
            <span className={`text-xs font-medium ${step >= i ? 'text-blue-600' : 'text-slate-400'}`}>
              {i === 1 ? '파일 업로드' : i === 2 ? '컬럼 매핑' : i === 3 ? '유효성 검증' : '일괄 저장'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">CSV 또는 Excel 파일 드래그 앤 드롭</h3>
            <p className="text-sm text-slate-500 mt-2 mb-6">또는 클릭하여 파일 선택 (PapaParse / SheetJS 연동)</p>
            <button 
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              임시 파일 업로드 (다음 단계)
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping (Mock) */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>컬럼 매핑</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">업로드된 파일의 열(Column)과 시스템의 표준 필드를 연결해주세요.</p>
            {/* ... 매핑 UI 뼈대 ... */}
            <div className="flex justify-end pt-4 border-t mt-6">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                다음 단계 <ArrowRight size={16} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Editor (Mock) */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>데이터 검증 및 인라인 수정</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
              모든 내역이 기본적으로 <b>'미분류'</b> 상태입니다. 일괄 지정 후 저장하세요.
            </div>
            {/* ... 인라인 테이블 UI 뼈대 ... */}
            <div className="flex justify-end pt-4 border-t mt-6">
              <button onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                구글 시트에 일괄 저장 <ArrowRight size={16} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success (Mock) */}
      {step === 4 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">수입 완료!</h3>
            <p className="text-slate-600 mt-2">총 45건의 거래 내역이 성공적으로 Google Sheets DB에 저장되었습니다.</p>
            <button 
              onClick={() => setStep(1)}
              className="mt-8 px-6 py-2 border rounded-lg font-medium hover:bg-slate-50"
            >
              새로운 파일 업로드
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
