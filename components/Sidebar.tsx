'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Tags, WalletCards, PieChart, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '거래 내역', href: '/transactions', icon: Receipt },
  { name: '카테고리', href: '/categories', icon: Tags },
  { name: '자산/부채', href: '/assets', icon: WalletCards },
  { name: '예산 관리', href: '/budgets', icon: PieChart },
  { name: '데이터 수입', href: '/import', icon: Download },
  { name: '설정', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r h-screen fixed top-0 left-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800">PFM App</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-slate-100 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around items-center h-16 z-50 px-2 pb-safe">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-blue-600" : "text-slate-500"
              )}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
