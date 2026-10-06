// 클라이언트 측 통신 모듈 (React Query, SWR 등과 연계하여 사용)
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || 'https://script.google.com/macros/s/AKfycbwDFcd00SMa27jSn6ZpluqSZY4YxR2c0WCjYAioo3jq_NPLuliZLzy-CJI8_YdiScob7w/exec';

export type CrudAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * 특정 시트의 데이터를 조회합니다.
 */
export async function fetchSheetData<T>(sheetName: string): Promise<T[]> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'READ', sheetName })
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data as T[];
}

/**
 * 특정 시트에 데이터를 추가/수정/삭제합니다.
 */
export async function mutateSheetData<T>(
  sheetName: string, 
  action: Exclude<CrudAction, 'READ'>, 
  data: Partial<T>
): Promise<T> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, sheetName, data })
  });

  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data as T;
}

/* 
// React Query를 활용한 커스텀 훅 예시 (옵션)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '../types/finance';

export function useTransactions() {
  return useQuery({
    queryKey: ['Transactions'],
    queryFn: () => fetchSheetData<Transaction>('Transactions')
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTx: Partial<Transaction>) => mutateSheetData<Transaction>('Transactions', 'CREATE', newTx),
    onSuccess: () => {
      // 낙관적 업데이트(Optimistic Update) 또는 무효화(Invalidate)를 통해 UI 즉시 갱신
      queryClient.invalidateQueries({ queryKey: ['Transactions'] });
    }
  });
}
*/
