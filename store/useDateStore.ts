import { create } from 'zustand';
import { addMonths, setDate, startOfMonth, endOfMonth, isAfter } from 'date-fns';

interface DateState {
  baseDay: number; // 1 ~ 31
  isSalaryCycle: boolean; // true: 월급주기, false: 달력기준
  setBaseDay: (day: number) => void;
  toggleCycle: () => void;
  getPeriod: () => { start: Date; end: Date };
}

export const useDateStore = create<DateState>((set, get) => ({
  baseDay: 1, // 기본값: 매월 1일
  isSalaryCycle: false,
  
  setBaseDay: (day) => set({ baseDay: day, isSalaryCycle: true }), // 날짜 변경 시 자동 월급주기 모드로
  
  toggleCycle: () => set((state) => ({ isSalaryCycle: !state.isSalaryCycle })),
  
  getPeriod: () => {
    const { baseDay, isSalaryCycle } = get();
    const today = new Date();
    
    if (!isSalaryCycle || baseDay === 1) {
      // 달력 기준 (당월 1일 ~ 당월 말일)
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }
    
    // 월급 주기 기준 (예: 17일)
    // 오늘이 17일 이후면 이번달 17일 ~ 다음달 16일
    // 오늘이 17일 이전이면 저번달 17일 ~ 이번달 16일
    let start = setDate(today, baseDay);
    let end = setDate(addMonths(today, 1), baseDay - 1);
    
    if (isAfter(start, today)) {
      start = setDate(addMonths(today, -1), baseDay);
      end = setDate(today, baseDay - 1);
    }
    
    return { start, end };
  }
}));
