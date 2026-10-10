import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, Account, CategoryItem, AssetValuation, Recurring, Budget } from '../types/finance';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwDFcd00SMa27jSn6ZpluqSZY4YxR2c0WCjYAioo3jq_NPLuliZLzy-CJI8_YdiScob7w/exec';

export type CrudAction = 'CREATE' | 'UPDATE' | 'DELETE';

interface AppData {
  Accounts: Account[];
  Transactions: Transaction[];
  Budgets: Budget[];
  Categories: CategoryItem[];
  AssetValuations: AssetValuation[];
  Recurring: Recurring[];
}

export async function fetchAllData(): Promise<AppData> {
  const response = await fetch(GAS_URL, {
    method: 'GET'
  });
  const result = await response.json();
  if (result.success === false) throw new Error(result.error);
  const data = (result.data ? result.data : result) as AppData;
  
  // Sanitization: Remove transactions with invalid dates to prevent crashing
  if (data.Transactions) {
    data.Transactions = data.Transactions.filter(tx => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return !isNaN(d.getTime());
    });
  }
  
  return data;
}

export async function mutateSheetData<T>(sheetName: keyof AppData, action: CrudAction, data: Partial<T> | Partial<T>[]): Promise<T | T[]> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, sheetName, data })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// 통합 데이터 패칭 훅 (로딩 속도 대폭 개선)
export function useAppData() {
  return useQuery({
    queryKey: ['appData'],
    queryFn: fetchAllData,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

// 범용 낙관적 업데이트 훅
export function useOptimisticMutation<T extends { id?: string }>(sheetName: keyof AppData) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, data }: { action: CrudAction, data: Partial<T> }) => mutateSheetData<T>(sheetName, action, data),
    onMutate: async ({ action, data }) => {
      await queryClient.cancelQueries({ queryKey: ['appData'] });
      const previousData = queryClient.getQueryData<AppData>(['appData']);

      if (previousData) {
        queryClient.setQueryData<AppData>(['appData'], (old) => {
          if (!old) return old;
          const list = [...(old[sheetName] as any[])] as T[];
          
          if (action === 'CREATE') {
            return { ...old, [sheetName]: [...list, data as T] };
          } else if (action === 'UPDATE') {
            return { ...old, [sheetName]: list.map(item => item.id === data.id ? { ...item, ...data } : item) };
          } else if (action === 'DELETE') {
            return { ...old, [sheetName]: list.filter(item => item.id !== data.id) };
          }
          return old;
        });
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['appData'], context.previousData);
      }
    },
    onSettled: () => {
      // 백그라운드에서 진짜 데이터로 동기화
      queryClient.invalidateQueries({ queryKey: ['appData'] });
    },
  });
}
