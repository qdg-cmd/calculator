'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UploadCloud, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { useOptimisticMutation } from '@/lib/googleSheetsApi';
import { Transaction } from '@/types/finance';

export default function ImportWizardPage() {
  const [step, setStep] = useState(1);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const mutateBatch = useOptimisticMutation<Transaction>('Transactions');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setParsedData(results.data);
          setStep(3);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setParsedData(data);
        setStep(3);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleSave = async () => {
    const formatted: any[] = parsedData.slice(0, 50).map((row: any) => ({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: parseInt(row['금액'] || row['amount'] || row['이용금액'] || 0, 10),
      type: 'expense',
      fromAccountId: '',
      toAccountId: '',
      merchant: row['가맹점'] || row['merchant'] || row['이용가맹점명'] || '알 수 없음',
      mainCategory: '지출',
      subCategory: '미분류',
      memo: 'CSV Import',
      isRecurring: false
    }));

    await mutateBatch.mutateAsync({ action: 'CREATE', data: formatted as any });
    setStep(4);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">데이터 수입(Import) 마법사</h1>
        <p className="text-sm text-slate-500 mt-1">은행/카드사 명세서(CSV/Excel)를 안전하게 DB로 넣습니다.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 text-sm text-blue-800 mb-6">
        <Info className="flex-shrink-0" size={20} />
        <div>
          <p className="font-bold mb-1">업로드 전 엑셀/CSV 필수 확인 사항!</p>
          <p>파일의 <strong>첫 번째 줄(헤더)</strong>에 반드시 아래의 이름이 포함되어 있어야 자동으로 인식됩니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>이용금액</strong> (또는 금액, amount): 결제 금액 숫자 (예: 15000)</li>
            <li><strong>이용가맹점명</strong> (또는 가맹점, merchant): 결제처 이름 (예: 스타벅스)</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between relative mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }}></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > i ? <CheckCircle2 size={16} /> : i}
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 relative">
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <UploadCloud size={32} className="text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">여기를 눌러 CSV 또는 Excel 파일 선택</h3>
            <p className="text-sm text-slate-500 mt-2">브라우저 안에서만 처리되므로 안전합니다.</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>데이터 확인 ({parsedData.length}건)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
              정상적으로 읽어들였습니다. 기본적으로 '미분류' 지출로 구글 시트에 즉시 일괄 등록됩니다.
            </div>
            <div className="flex justify-end pt-4 border-t mt-6">
              <button onClick={handleSave} disabled={mutateBatch.isPending} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
                {mutateBatch.isPending ? '저장 중...' : '구글 시트에 일괄 저장'} <ArrowRight size={16} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 size={32} className="text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">수입 완료!</h3>
            <p className="text-slate-500 mt-2">거래 내역 탭에서 방금 추가된 항목들을 확인하고 분류를 수정하세요.</p>
            <button onClick={() => setStep(1)} className="mt-8 px-6 py-2 border rounded-lg hover:bg-slate-50">새 파일 업로드</button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
