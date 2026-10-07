import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DateState {
  baseDay: number; // 1 ~ 31
  periodType: 'calendar' | 'salary';
  selectedDate: string; // 저장 시 에러 방지를 위해 ISO string 사용
  setBaseDay: (day: number) => void;
  setPeriodType: (type: 'calendar' | 'salary') => void;
  setSelectedDate: (date: string) => void;
}

export const useDateStore = create<DateState>()(
  persist(
    (set) => ({
      baseDay: 1,
      periodType: 'calendar',
      selectedDate: new Date().toISOString(),
      setBaseDay: (day) => set({ baseDay: day }),
      setPeriodType: (type) => set({ periodType: type }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'pfm-date-storage',
    }
  )
);

export function getDateRange(selectedDateStr: string, baseDay: number, periodType: 'calendar' | 'salary') {
  const selectedDate = new Date(selectedDateStr);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  if (periodType === 'calendar' || baseDay === 1) {
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0, 23, 59, 59)
    };
  }

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
