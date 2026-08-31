import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { ExpenseEntry, Employee, RevenueEntry } from '@/lib/types';
import { EXPENSE_CATEGORIES } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Field, TextInput, Select, Button, TextArea } from '@/components/Form';
import { BarChart } from '@/components/Charts';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatINR } from '@/lib/currency';
import { Receipt, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#7653B8',
  Salaries: '#4B2A87',
  Utilities: '#9B7BDE',
  'Software Subscriptions': '#C4B5FD',
  Marketing: '#8B5CF6',
  Miscellaneous: '#A78BFA',
};

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0] as (typeof EXPENSE_CATEGORIES)[number], description: '', amount: '0', date: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    const [exp, emp, rev] = await Promise.all([
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('employees').select('*'),
      supabase.from('revenue').select('*'),
    ]);
    setExpenses(exp.data ?? []);
    setEmployees(emp.data ?? []);
    setRevenue(rev.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ category: EXPENSE_CATEGORIES[0], description: '', amount: '0', date: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const openEdit = (entry: ExpenseEntry) => {
    setEditing(entry);
    setForm({ category: entry.category as (typeof EXPENSE_CATEGORIES)[number], description: entry.description ?? '', amount: String(entry.amount), date: entry.date });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { category: form.category, description: form.description || null, amount: Number(form.amount), date: form.date };
    if (editing) {
      await supabase.from('expenses').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('expenses').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    load();
  };

  const stats = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(); const y = now.getFullYear();

    const totalSalaries = employees.reduce((s, e) => s + Number(e.salary), 0);
    const monthlyOtherExpenses = expenses.filter((e) => new Date(e.date).getMonth() === m && new Date(e.date).getFullYear() === y).reduce((s, e) => s + Number(e.amount), 0);
    const monthlyExpenses = totalSalaries + monthlyOtherExpenses;

    const totalOtherExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalExpenses = totalSalaries + totalOtherExpenses;

    const monthlyRevenue = revenue.filter((r) => r.payment_status === 'paid' && new Date(r.date).getMonth() === m && new Date(r.date).getFullYear() === y).reduce((s, r) => s + Number(r.amount), 0);
    const totalRevenue = revenue.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + Number(r.amount), 0);

    const monthlyProfit = monthlyRevenue - monthlyExpenses;
    const totalProfit = totalRevenue - totalExpenses;

    return { totalSalaries, monthlyExpenses, totalExpenses, monthlyRevenue, totalRevenue, monthlyProfit, totalProfit, monthlyOtherExpenses };
  }, [expenses, employees, revenue]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)));
    if (employees.length > 0) map.set('Salaries', employees.reduce((s, e) => s + Number(e.salary), 0));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] ?? '#7653B8' }));
  }, [expenses, employees]);

  const profitTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; value: number; color?: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const rev = revenue.filter((r) => r.payment_status === 'paid' && new Date(r.date).getMonth() === m && new Date(r.date).getFullYear() === y).reduce((s, r) => s + Number(r.amount), 0);
      const exp = expenses.filter((e) => new Date(e.date).getMonth() === m && new Date(e.date).getFullYear() === y).reduce((s, e) => s + Number(e.amount), 0) + employees.reduce((s, em) => s + Number(em.salary), 0);
      const profit = rev - exp;
      months.push({ label: d.toLocaleString('en-US', { month: 'short' }), value: profit, color: profit >= 0 ? 'linear-gradient(180deg, #C4B5FD 0%, #7653B8 100%)' : 'linear-gradient(180deg, #ef4444 0%, #7f1d1d 100%)' });
    }
    return months;
  }, [revenue, expenses, employees]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#E8E5F0] border-t-[#7653B8] rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Expenses & Profit"
        subtitle="Track costs and calculate net profit"
        action={<Button onClick={openAdd}><Plus size={18} /> Add Expense</Button>}
      />

      {expenses.length === 0 && employees.length === 0 ? (
        <div className="glass-card rounded-2xl p-8">
          <EmptyState
            icon={<Receipt className="text-[#7653B8]" size={40} />}
            title="No expenses tracked yet"
            description="Add expense entries and employees with salaries to calculate your net profit automatically."
            action={<Button onClick={openAdd}><Plus size={18} /> Add First Expense</Button>}
          />
        </div>
      ) : (
        <>
          {/* Profit indicator */}
          <div className={`glass-card rounded-2xl p-6 mb-6 animate-fade-in-up ${stats.monthlyProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${stats.monthlyProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {stats.monthlyProfit >= 0 ? <TrendingUp className="text-green-500" size={32} /> : <TrendingDown className="text-red-500" size={32} />}
                </div>
                <div>
                  <p className="text-sm text-[#6B6580]">Net Profit (This Month)</p>
                  <p className={`text-3xl font-extrabold ${stats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    <AnimatedCounter value={stats.monthlyProfit} prefix="₹" />
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-xs text-[#9B95A8]">Revenue</p>
                  <p className="text-xl font-bold text-[#7653B8]"><AnimatedCounter value={stats.monthlyRevenue} prefix="₹" /></p>
                </div>
                <div className="text-2xl text-[#C4C0D0]">−</div>
                <div>
                  <p className="text-xs text-[#9B95A8]">Expenses</p>
                  <p className="text-xl font-bold text-red-500"><AnimatedCounter value={stats.monthlyExpenses} prefix="₹" /></p>
                </div>
                <div className="text-2xl text-[#C4C0D0]">=</div>
                <div>
                  <p className="text-xs text-[#9B95A8]">Profit</p>
                  <p className={`text-xl font-bold ${stats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}><AnimatedCounter value={stats.monthlyProfit} prefix="₹" /></p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-[#7653B8]/10"><DollarSign className="text-[#7653B8]" size={18} /></div><span className="text-sm text-[#6B6580]">Total Revenue</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.totalRevenue} prefix="₹" /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-2">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-red-50"><Wallet className="text-red-500" size={18} /></div><span className="text-sm text-[#6B6580]">Total Expenses</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.totalExpenses} prefix="₹" /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-[#7653B8]/10"><Wallet className="text-[#7653B8]" size={18} /></div><span className="text-sm text-[#6B6580]">Salaries</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.totalSalaries} prefix="₹" /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-green-50"><TrendingUp className="text-green-500" size={18} /></div><span className="text-sm text-[#6B6580]">Total Profit</span></div>
              <p className={`text-2xl font-extrabold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}><AnimatedCounter value={stats.totalProfit} prefix="₹" /></p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Expenses by Category</h3>
              {byCategory.length > 0 ? <BarChart data={byCategory} /> : <p className="text-[#9B95A8] text-sm py-8 text-center">No data</p>}
            </div>
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Profit Trend (6 months)</h3>
              <BarChart data={profitTrend} />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Expense Entries</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-[#6B6580] border-b border-[#E8E5F0]">
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((entry) => (
                    <tr key={entry.id} className="border-b border-[#F0EEF8] hover:bg-[#F8F7FC] transition-all">
                      <td className="py-3 text-sm">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${CATEGORY_COLORS[entry.category] ?? '#7653B8'}15`, color: CATEGORY_COLORS[entry.category] ?? '#7653B8' }}>
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[#6B6580]">{entry.description ?? '—'}</td>
                      <td className="py-3 text-sm font-bold text-[#1F1B2E]">{formatINR(Number(entry.amount))}</td>
                      <td className="py-3 text-sm text-[#6B6580]">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(entry)} className="p-2 rounded-lg text-[#9B95A8] hover:text-[#7653B8] hover:bg-[#F0EEF8] transition-all"><Pencil size={16} /></button>
                          <button onClick={() => remove(entry.id)} className="p-2 rounded-lg text-[#9B95A8] hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as (typeof EXPENSE_CATEGORIES)[number] })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Description (optional)"><TextArea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Monthly office rent..." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₹)"><TextInput type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
            <Field label="Date"><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Expense'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
