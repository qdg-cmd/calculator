'use client';
import { useDateStore } from '@/store/useDateStore';
import { useAppData } from '@/lib/googleSheetsApi';
import { useState } from 'react';

export default function Settings() {
  const { baseDay, periodType, setBaseDay, setPeriodType } = useDateStore();
  const { data, isLoading } = useAppData();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    if (!data || !data.Transactions || data.Transactions.length === 0) {
      alert('백업할 거래 내역이 없습니다.');
      return;
    }
    
    setIsExporting(true);
    try {
      const txs = data.Transactions;
      // CSV 헤더
      const headers = ['id', '날짜', '금액', '유형', '출금계좌', '입금계좌', '내용', '대분류', '소분류', '메모'];
      
      const csvRows = [
        headers.join(','),
        ...txs.map(tx => {
          const row = [
            tx.id,
            tx.date,
            tx.amount,
            tx.type,
            tx.fromAccountId || '',
            tx.toAccountId || '',
            `"${(tx.merchant || '').replace(/"/g, '""')}"`, // 콤마 등 특수기호 방지
            tx.mainCategory,
            tx.subCategory,
            `"${(tx.memo || '').replace(/"/g, '""')}"`
          ];
          return row.join(',');
        })
      ];
      
      const csvContent = "\\uFEFF" + csvRows.join('\\n'); // Excel 한글 깨짐 방지 BOM 추가
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `가계부_백업_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold">환경 설정</h1>
      
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-8">
        
        {/* 설정기준 설정 영역 */}
        <section>
          <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2">
            월 내역 설정기준 설정
          </h3>
          <p className="text-sm text-slate-500 mb-4">대시보드와 예산 차트 등 전체에 적용되는 날짜 기준 설정입니다.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">기준 방식</p>
                <p className="text-xs text-slate-500">달력 기준(1일~말일) 또는 특정 월급일을 기준으로 합니다.</p>
              </div>
              <div className="flex bg-slate-200 rounded-lg p-1">
                <button 
                  onClick={() => setPeriodType('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${periodType === 'calendar' ? 'bg-white shadow' : 'text-slate-600'}`}>
                  달력 기준
                </button>
                <button 
                  onClick={() => setPeriodType('salary')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${periodType === 'salary' ? 'bg-white shadow' : 'text-slate-600'}`}>
                  월급 주기
                </button>
              </div>
            </div>

            {periodType === 'salary' && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                <div>
                  <p className="font-medium">월급일(월정 시작일)</p>
                  <p className="text-xs text-slate-500">매월 이 날짜를 기준으로 수입/지출을 계산합니다.</p>
                </div>
                <select 
                  value={baseDay}
                  onChange={e => setBaseDay(Number(e.target.value))}
                  className="border rounded-lg px-4 py-2 bg-white"
                >
                  {Array.from({length: 31}).map((_, i) => (
                    <option key={i} value={i+1}>매월 {i+1}일</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* 데이터 관리 (백업) 영역 */}
        <section>
          <h3 className="font-bold text-lg mb-4 border-b pb-2 text-blue-700">데이터 관리 및 백업</h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">전체 거래내역 엑셀 다운로드</p>
              <p className="text-xs text-slate-500">그동안의 모든 수입/지출 데이터를 CSV 파일로 기기에 저장합니다.</p>
            </div>
            <button 
              onClick={handleExportCSV}
              disabled={isLoading || isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {isExporting ? '다운로드 중...' : 'CSV 백업하기'}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
