import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'slate' | 'midnight' | 'sage' | 'rose' | 'luxury' | 'lavender';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  concept: string;
  tag: string;
  previewBg: string;
  previewCard: string;
  previewPrimary: string;
  previewAccent: string;
  previewText: string;
  isDark: boolean;
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'slate',
    name: '모던 슬레이트',
    concept: '금융 표준의 신뢰감과 깔끔한 로열 블루 (기본)',
    tag: '기본 라이트',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    previewPrimary: '#2563eb',
    previewAccent: '#eff6ff',
    previewText: '#0f172a',
    isDark: false,
  },
  {
    id: 'midnight',
    name: '미드나이트 다크',
    concept: '눈이 편안한 딥 차콜 & 토스 핀테크 감성',
    tag: '다크 모드',
    previewBg: '#090d16',
    previewCard: '#131b2e',
    previewPrimary: '#38bdf8',
    previewAccent: '#1e293b',
    previewText: '#f8fafc',
    isDark: true,
  },
  {
    id: 'sage',
    name: '네이처 세이지',
    concept: '자산 성장의 포레스트 그린 & 차분한 힐링',
    tag: '내추럴 그린',
    previewBg: '#f4f7f4',
    previewCard: '#ffffff',
    previewPrimary: '#16a34a',
    previewAccent: '#f0fdf4',
    previewText: '#142817',
    isDark: false,
  },
  {
    id: 'rose',
    name: '소프트 로즈 & 피치',
    concept: '감성 다이어리를 쓰듯 따뜻하고 다정한 코랄',
    tag: '감성 핑크',
    previewBg: '#fff5f6',
    previewCard: '#ffffff',
    previewPrimary: '#e11d48',
    previewAccent: '#fff1f2',
    previewText: '#2b1115',
    isDark: false,
  },
  {
    id: 'luxury',
    name: '럭셔리 골드 & 옵시디언',
    concept: 'VIP 프라이빗 뱅킹(PB) 자산관리의 품격',
    tag: 'VIP 골드 다크',
    previewBg: '#0e0f12',
    previewCard: '#18191e',
    previewPrimary: '#d97706',
    previewAccent: '#2b2210',
    previewText: '#fdfbf7',
    isDark: true,
  },
  {
    id: 'lavender',
    name: '네오 라벤더',
    concept: '감각적인 MZ 핀테크 스타일의 파스텔 퍼플',
    tag: '트렌디 퍼플',
    previewBg: '#f8f6fc',
    previewCard: '#ffffff',
    previewPrimary: '#7c3aed',
    previewAccent: '#faf5ff',
    previewText: '#1d102e',
    isDark: false,
  },
];

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'slate',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'pfm-theme-storage',
    }
  )
);
