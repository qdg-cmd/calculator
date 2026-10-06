'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';
import { useMutateTransactionsBatch } from '@/lib/googleSheetsApi';
import { Transaction } from '@/types/finance';

export default function ImportWizardPage() {
  const [step, setStep] = useState(1);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const mutateBatch = useMutateTransactionsBatch();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setParsedData(results.data);
          setStep(3); // 매핑 생략하고 바로 검증으로 이동 (데모용)
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
    // 임시 매핑 로직 (실제 필드에 맞게 가공 필요)
    const formatted: Partial<Transaction>[] = parsedData.slice(0, 50).map((row: any) => ({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: parseInt(row['금액'] || row['amount'] || 0, 10),
      type: 'expense',
      merchant: row['가맹점'] || row['merchant'] || '알 수 없음',
      mainCategory: '지출',
      subCategory: '미분류',
      memo: 'CSV Import',
      isRecurring: false
    }));

    await mutateBatch.mutateAsync(formatted);
    setStep(4);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">데이터 수입(Import) 위저드</h1>
        <p className="text-sm text-slate-500 mt-1">은행 및 카드사 명세서(CSV/Excel)를 안전하게 DB로 이관합니다.</p>
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
            <h3 className="text-lg font-semibold text-slate-700">CSV 또는 Excel 파일 클릭하여 업로드</h3>
            <p className="text-sm text-slate-500 mt-2">PapaParse / SheetJS 기반 로컬 파싱 (서버 전송 없음)</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>데이터 검증 ({parsedData.length}건)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">기본 '미분류'로 구글 시트에 즉시 일괄 저장됩니다.</div>
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
            <button onClick={() => setStep(1)} className="mt-8 px-6 py-2 border rounded-lg hover:bg-slate-50">새 파일 업로드</button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
