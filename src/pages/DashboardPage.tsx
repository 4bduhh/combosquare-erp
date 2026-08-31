import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Employee, RevenueEntry, ExpenseEntry, ProjectEntry, TargetEntry } from '@/lib/types';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { BarChart, ProgressRing } from '@/components/Charts';
import { formatINR } from '@/lib/currency';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import {
  DollarSign, TrendingUp, Users, FolderKanban, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Wallet, Target as TargetIcon,
} from 'lucide-react';

export function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [targets, setTargets] = useState<TargetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [emp, rev, exp, proj, tgt] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('revenue').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('targets').select('*'),
      ]);
      setEmployees(emp.data ?? []);
      setRevenue(rev.data ?? []);
      setExpenses(exp.data ?? []);
      setProjects(proj.data ?? []);
      setTargets(tgt.data ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const totalRevenue = revenue.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + Number(r.amount), 0);
    const monthlyRevenue = revenue
      .filter((r) => r.payment_status === 'paid' && new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year)
      .reduce((s, r) => s + Number(r.amount), 0);

    const totalSalaries = employees.reduce((s, e) => s + Number(e.salary), 0);
    const otherExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalExpenses = totalSalaries + otherExpenses;
    const monthlyOtherExpenses = expenses
      .filter((e) => new Date(e.date).getMonth() === month && new Date(e.date).getFullYear() === year)
      .reduce((s, e) => s + Number(e.amount), 0);
    const monthlyExpenses = totalSalaries + monthlyOtherExpenses;
    const netProfit = totalRevenue - totalExpenses;

    const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;

    const currentTarget = targets.find((t) => t.month === month + 1 && t.year === year);

    return {
      totalRevenue, monthlyRevenue, totalExpenses, monthlyExpenses, netProfit,
      activeEmployees: employees.length, activeProjects, completedProjects,
      currentTarget,
    };
  }, [employees, revenue, expenses, projects, targets]);

  const monthlyChart = useMemo(() => {
    const now = new Date();
    const months: { label: string; value: number; color?: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const rev = revenue
        .filter((r) => r.payment_status === 'paid' && new Date(r.date).getMonth() === m && new Date(r.date).getFullYear() === y)
        .reduce((s, r) => s + Number(r.amount), 0);
      const exp = expenses
        .filter((e) => new Date(e.date).getMonth() === m && new Date(e.date).getFullYear() === y)
        .reduce((s, e) => s + Number(e.amount), 0) + employees.reduce((s, em) => s + Number(em.salary), 0);
      const profit = rev - exp;
      months.push({
        label: d.toLocaleString('en-US', { month: 'short' }),
        value: profit,
        color: profit >= 0 ? 'linear-gradient(180deg, #C4B5FD 0%, #7653B8 100%)' : 'linear-gradient(180deg, #ef4444 0%, #7f1d1d 100%)',
      });
    }
    return months;
  }, [revenue, expenses, employees]);

  const recentActivity = useMemo(() => {
    const items: { icon: typeof DollarSign; text: string; time: string; color: string }[] = [];
    [...revenue].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3).forEach((r) => {
      items.push({
        icon: DollarSign,
        text: `Revenue: ${r.client_name} — ${r.project_name}`,
        time: new Date(r.created_at).toLocaleDateString(),
        color: 'text-[#7653B8]',
      });
    });
    [...projects].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3).forEach((p) => {
      items.push({
        icon: FolderKanban,
        text: `Project: ${p.project_name} for ${p.client_name}`,
        time: new Date(p.created_at).toLocaleDateString(),
        color: 'text-[#9B7BDE]',
      });
    });
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
  }, [revenue, projects]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#E8E5F0] border-t-[#7653B8] rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: stats.totalRevenue, isCurrency: true, icon: DollarSign, color: '#7653B8' },
    { label: 'Monthly Revenue', value: stats.monthlyRevenue, isCurrency: true, icon: TrendingUp, color: '#7653B8' },
    { label: 'Total Expenses', value: stats.totalExpenses, isCurrency: true, icon: Wallet, color: '#ef4444' },
    { label: 'Net Profit', value: stats.netProfit, isCurrency: true, icon: stats.netProfit >= 0 ? ArrowUpRight : ArrowDownRight, color: stats.netProfit >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'Active Employees', value: stats.activeEmployees, isCurrency: false, icon: Users, color: '#7653B8' },
    { label: 'Active Projects', value: stats.activeProjects, isCurrency: false, icon: FolderKanban, color: '#7653B8' },
    { label: 'Completed Projects', value: stats.completedProjects, isCurrency: false, icon: CheckCircle2, color: '#22c55e' },
    { label: 'Monthly Expenses', value: stats.monthlyExpenses, isCurrency: true, icon: Wallet, color: '#ef4444' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dashboard" subtitle="Your company at a glance" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${card.color}15` }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1F1B2E]">
                {card.isCurrency ? <AnimatedCounter value={card.value} prefix="₹" /> : <AnimatedCounter value={card.value} />}
              </p>
              <p className="text-sm text-[#6B6580] mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Profit chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-fade-in-up">
          <h3 className="text-lg font-bold text-[#1F1B2E] mb-1">Monthly Profit Trend</h3>
          <p className="text-sm text-[#6B6580] mb-6">Revenue minus expenses over the last 6 months</p>
          <BarChart data={monthlyChart} />
        </div>

        {/* Target progress */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
          <h3 className="text-lg font-bold text-[#1F1B2E] mb-1">Monthly Target</h3>
          <p className="text-sm text-[#6B6580] mb-6">
            {stats.currentTarget ? new Date(stats.currentTarget.year, stats.currentTarget.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'No target set'}
          </p>
          {stats.currentTarget ? (
            <div className="flex flex-col items-center gap-6">
              <ProgressRing
                value={stats.monthlyRevenue}
                max={Number(stats.currentTarget.revenue_target)}
                size={140}
                label="Revenue"
              />
              <div className="w-full space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#6B6580]">Projects Target</span>
                    <span className="font-semibold text-[#1F1B2E]">
                      {projects.filter((p) => new Date(p.created_at).getMonth() === new Date().getMonth()).length} / {stats.currentTarget.projects_target}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F0EEF8] overflow-hidden">
                    <div className="h-full rounded-full progress-fill" style={{ width: `${Math.min((projects.filter((p) => new Date(p.created_at).getMonth() === new Date().getMonth()).length / stats.currentTarget.projects_target) * 100, 100)}%`, background: 'linear-gradient(90deg, #C4B5FD, #7653B8)' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <TargetIcon className="text-[#C4B5FD] mb-3" size={40} />
              <p className="text-[#9B95A8] text-sm">Set a monthly target to track progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
        <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-[#9B95A8] text-sm py-8 text-center">No activity yet. Start adding revenue, projects, and employees.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F7FC] hover:bg-[#F0EEF8] transition-all">
                  <div className="p-2 rounded-lg bg-[#F0EEF8]">
                    <Icon size={16} className={act.color} />
                  </div>
                  <span className="text-sm text-[#4B2A87] flex-1 truncate">{act.text}</span>
                  <span className="text-xs text-[#9B95A8]">{act.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
