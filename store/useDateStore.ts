import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DateState {
  baseDay: number; // 1 ~ 31
  periodType: 'calendar' | 'salary'; // 달력 기준 vs 월급 주기 기준
  selectedDate: Date;
  setBaseDay: (day: number) => void;
  setPeriodType: (type: 'calendar' | 'salary') => void;
  setSelectedDate: (date: Date) => void;
}

export const useDateStore = create<DateState>()(
  persist(
    (set) => ({
      baseDay: 1,
      periodType: 'calendar',
      selectedDate: new Date(),
      setBaseDay: (day) => set({ baseDay: day }),
      setPeriodType: (type) => set({ periodType: type }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'pfm-date-storage',
    }
  )
);

// 산정 기준일에 따른 시작일과 종료일 계산 함수
export function getDateRange(selectedDate: Date, baseDay: number, periodType: 'calendar' | 'salary') {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  if (periodType === 'calendar' || baseDay === 1) {
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0, 23, 59, 59)
    };
  }

  // 월급 주기 기준 (예: 25일)
  // 현재 날짜가 25일 이전이면 전월 25일 ~ 당월 24일
  // 현재 날짜가 25일 이후면 당월 25일 ~ 익월 24일
  const currentDay = selectedDate.getDate();
  let startMonth = month;
  let endMonth = month + 1;
  
  if (currentDay < baseDay) {
    startMonth = month - 1;
    endMonth = month;
  }
  
  return {
    startDate: new Date(year, startMonth, baseDay),
    endDate: new Date(year, endMonth, baseDay - 1, 23, 59, 59)
  };
}
