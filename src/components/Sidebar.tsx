import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  Receipt,
  FolderKanban,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import logoUrl from '/Combo_Square_Logo.png';

export type PageKey = 'dashboard' | 'employees' | 'attendance' | 'revenue' | 'expenses' | 'projects' | 'targets' | 'settings';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV_ITEMS: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'expenses', label: 'Expenses & Profit', icon: Receipt },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'targets', label: 'Targets', icon: Target },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageKey) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#7653B8]/30">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Combo Square" className="w-10 h-10 rounded-xl object-contain shrink-0 bg-white/90 p-0.5" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-[#FFFFFF] text-sm tracking-tight truncate">COMBO SQUARE</h1>
            <p className="text-[#D9C8FF] text-xs truncate">Agency Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                active
                  ? 'bg-peach-gradient text-[#4B2A87] shadow-lg'
                  : 'text-[#FFFFFF]/60 hover:text-[#FFFFFF] hover:bg-[#7653B8]/20'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#D9C8FF]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#7653B8]/30">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#FFFFFF]/60 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-violet-dusk border-b border-[#7653B8]/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="Combo Square" className="w-8 h-8 rounded-lg object-contain bg-white/90 p-0.5" />
          <span className="font-bold text-[#FFFFFF] text-sm">COMBO SQUARE</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#FFFFFF] hover:bg-[#7653B8]/30"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-violet-dusk border-r border-[#7653B8]/30 flex flex-col animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-violet-dusk border-r border-[#7653B8]/30 flex-col z-20">
        {sidebarContent}
      </aside>
    </>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="lg:ml-64 min-h-screen bg-[#F8F7FC] pt-16 lg:pt-0">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F1B2E] tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#6B6580] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}