'use client';
import { useDateStore } from '@/store/useDateStore';
import { useAppData } from '@/lib/googleSheetsApi';
import { useThemeStore, THEMES } from '@/store/useThemeStore';
import { useState } from 'react';
import { Palette, Check } from 'lucide-react';

export default function Settings() {
  const { baseDay, periodType, setBaseDay, setPeriodType } = useDateStore();
  const { theme, setTheme } = useThemeStore();
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
        
        {/* 화면 테마 설정 영역 */}
        <section>
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              화면 테마 설정
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              현재: {THEMES.find(t => t.id === theme)?.name}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            가계부 앱의 분위기와 색상을 기분에 맞게 변경해보세요. 선택 즉시 모든 화면에 실시간 적용됩니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {THEMES.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                    isSelected 
                      ? 'border-blue-600 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  style={{
                    backgroundColor: item.previewBg,
                    color: item.previewText,
                  }}
                >
                  {/* 상단 뱃지 & 선택 표시 */}
                  <div className="w-full flex items-center justify-between mb-3">
                    <span 
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: item.previewAccent,
                        color: item.previewPrimary,
                        border: `1px solid ${item.isDark ? '#334155' : item.previewPrimary}30`
                      }}
                    >
                      {item.tag}
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in-75">
                        <Check size={12} strokeWidth={3} />
                        적용중
                      </span>
                    ) : (
                      <span className="text-[11px] opacity-60">클릭하여 선택</span>
                    )}
                  </div>

                  {/* UI 미니어처 미리보기 박스 */}
                  <div 
                    className="w-full rounded-lg p-2.5 mb-3 border shadow-xs flex flex-col gap-1.5"
                    style={{
                      backgroundColor: item.previewCard,
                      borderColor: item.isDark ? '#2d3748' : '#e2e8f0',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2 rounded-full opacity-70" style={{ backgroundColor: item.previewText }} />
                      <div className="w-6 h-3 rounded-full text-[9px] flex items-center justify-center font-bold text-white" style={{ backgroundColor: item.previewPrimary }}>
                        ₩
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: item.previewAccent }} />
                    <div className="flex gap-1 mt-0.5">
                      <div className="flex-1 h-3 rounded" style={{ backgroundColor: item.previewPrimary, opacity: 0.85 }} />
                      <div className="flex-1 h-3 rounded" style={{ backgroundColor: item.previewAccent }} />
                    </div>
                  </div>

                  {/* 테마 이름 및 설명 */}
                  <div>
                    <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                      {item.name}
                    </h4>
                    <p className="text-[11px] mt-1 opacity-75 line-clamp-2 leading-relaxed">
                      {item.concept}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

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

        {/* PWA 앱 설치 안내 영역 */}
        <section>
          <h3 className="font-bold text-lg mb-4 border-b pb-2 text-indigo-700">앱 설치 (PWA) 및 홈 화면 추가</h3>
          <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
            <p className="text-sm font-medium text-slate-800">
              스마트폰 바탕화면에 앱 아이콘을 추가하여 주소창 없이 전체화면 앱으로 사용하실 수 있습니다.
            </p>
            <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded border">
              <p className="font-semibold text-indigo-600">📱 기기별 설치 방법 안내:</p>
              <p>• <strong>안드로이드 크롬/삼성인터넷:</strong> 브라우저 우측 상단 메뉴(⋮ 또는 ≡)를 누른 뒤 <span className="text-indigo-600 font-bold">[앱 설치]</span> 또는 <span className="text-indigo-600 font-bold">[홈 화면에 추가]</span>를 선택하세요.</p>
              <p>• <strong>아이폰 Safari:</strong> 하단 중앙의 공유 버튼(네모 위로 화살표 <span className="font-mono">📤</span>)을 누른 뒤 <span className="text-indigo-600 font-bold">[홈 화면에 추가]</span>를 누르시면 됩니다.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
