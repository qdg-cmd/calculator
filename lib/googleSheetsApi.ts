import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, Account, CategoryItem, AssetValuation, Recurring, Budget } from '../types/finance';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || 'https://script.google.com/macros/s/AKfycbwDFcd00SMa27jSn6ZpluqSZY4YxR2c0WCjYAioo3jq_NPLuliZLzy-CJI8_YdiScob7w/exec';

export type CrudAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';

export async function fetchSheetData<T>(sheetName: string): Promise<T[]> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'READ', sheetName })
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data as T[];
  } catch (error) {
    console.error(`Fetch Error on ${sheetName}:`, error);
    return []; // 실패 시 빈 배열 반환하여 앱 크래시 방지
  }
}

export async function mutateSheetData<T>(
  sheetName: string, 
  action: Exclude<CrudAction, 'READ'>, 
  data: Partial<T> | Partial<T>[]
): Promise<T | T[]> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, sheetName, data })
  });

  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// === React Query Hooks ===

export function useTransactions() {
  return useQuery({
    queryKey: ['Transactions'],
    queryFn: () => fetchSheetData<Transaction>('Transactions')
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ['Accounts'],
    queryFn: () => fetchSheetData<Account>('Accounts')
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['Categories'],
    queryFn: () => fetchSheetData<CategoryItem>('Categories')
  });
}

export function useAssetValuations() {
  return useQuery({
    queryKey: ['AssetValuations'],
    queryFn: () => fetchSheetData<AssetValuation>('AssetValuations')
  });
}

export function useMutateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, data }: { action: 'CREATE'|'UPDATE'|'DELETE', data: Partial<Transaction> }) => 
      mutateSheetData<Transaction>('Transactions', action, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Transactions'] });
    }
  });
}

export function useMutateTransactionsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction>[]) => mutateSheetData<Transaction>('Transactions', 'CREATE', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Transactions'] });
    }
  });
}

export function useMutateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, data }: { action: 'CREATE'|'UPDATE'|'DELETE', data: Partial<CategoryItem> }) => 
      mutateSheetData<CategoryItem>('Categories', action, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Categories'] });
    }
  });
}
