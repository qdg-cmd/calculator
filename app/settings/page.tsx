'use client';
import { useDateStore } from '@/store/useDateStore';

export default function Settings() {
  const { baseDay, periodType, setBaseDay, setPeriodType } = useDateStore();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold">환경 설정</h1>
      
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-8">
        
        {/* 산정기준일 설정 영역 */}
        <section>
          <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2">
            📅 전역 산정기준일 설정
          </h3>
          <p className="text-sm text-slate-500 mb-4">대시보드와 자산 차트 등 앱 전체에 적용되는 날짜 기준을 설정합니다.</p>
          
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
                  <p className="font-medium">월급일 (산정 시작일)</p>
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

        {/* 계좌 및 기타 설정 */}
        <section>
          <h3 className="font-bold text-lg mb-4 border-b pb-2">💳 결제수단 및 계좌 관리</h3>
          <p className="text-sm text-slate-500 mb-4">현재 계좌 및 결제수단 추가/수정은 구글 시트의 <strong>Accounts</strong> 탭에서 직접 관리할 수 있습니다.</p>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200" onClick={() => alert('구글 시트를 확인해주세요.')}>
            계좌 관리 가이드 보기
          </button>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-4 border-b pb-2">💾 데이터 백업</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">전체 데이터 내보내기</p>
              <p className="text-xs text-slate-500">DB 데이터를 CSV 형식으로 다운로드합니다.</p>
            </div>
            <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium" onClick={() => alert('구글 시트 메뉴 [파일] -> [다운로드] -> [CSV]를 이용하시면 가장 안전합니다.')}>
              CSV 다운로드 안내
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
