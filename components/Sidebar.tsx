'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Tags, WalletCards, PieChart, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
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
                  isActive ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex items-center h-16 z-50 px-2 pb-safe overflow-x-auto gap-4" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {navItems.filter(i => ["/dashboard", "/transactions", "/budgets", "/settings"].includes(i.href)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-blue-700 font-bold border-t-[3px] border-blue-600 bg-blue-50/50 -mt-[1px]" : "text-slate-500 hover:text-slate-900 border-t-[3px] border-transparent -mt-[1px]"
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
