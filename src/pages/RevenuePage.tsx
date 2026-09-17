import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { RevenueEntry, ServiceType, PaymentStatus } from '@/lib/types';
import { SERVICE_LABELS } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Field, TextInput, Select, Button } from '@/components/Form';
import { DonutChart, BarChart } from '@/components/Charts';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DateInput } from '@/components/DateInput';
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { DollarSign, Plus, Pencil, Trash2, TrendingUp, Calendar } from 'lucide-react';

const SERVICE_COLORS: Record<ServiceType, string> = {
  branding: '#7653B8',
  graphics: '#9B7BDE',
  web_static: '#4B2A87',
  web_dynamic: '#C4B5FD',
  web_ecommerce: '#8B5CF6',
  app_ios: '#A78BFA',
  app_android: '#B794F4',
  video_editing: '#D9C8FF',
};

export function RevenuePage() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueEntry | null>(null);
  const [form, setForm] = useState({
    client_name: '', project_name: '', service_type: 'branding' as ServiceType,
    amount: '0', date: new Date().toISOString().slice(0, 10), payment_status: 'paid' as PaymentStatus,
    advance_amount: '0',
  });

  const load = async () => {
    const { data, error } = await supabase.from('revenue').select('*').order('date', { ascending: false });
    if (error) console.error('Revenue fetch error:', error);
    setEntries(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ client_name: '', project_name: '', service_type: 'branding', amount: '0', date: new Date().toISOString().slice(0, 10), payment_status: 'paid', advance_amount: '0' });
    setModalOpen(true);
  };

  const openEdit = (entry: RevenueEntry) => {
    setEditing(entry);
    setForm({
      client_name: entry.client_name, project_name: entry.project_name, service_type: entry.service_type,
      amount: String(entry.amount), date: entry.date, payment_status: entry.payment_status,
      advance_amount: String(entry.advance_amount ?? 0),
    });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      client_name: form.client_name, project_name: form.project_name, service_type: form.service_type,
      amount: Number(form.amount), date: form.date, payment_status: form.payment_status,
      advance_amount: form.payment_status === 'advance' ? Number(form.advance_amount) : 0,
    };
    if (editing) {
      await supabase.from('revenue').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('revenue').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this revenue entry?')) return;
    await supabase.from('revenue').delete().eq('id', id);
    load();
  };

  const stats = useMemo(() => {
    const totalPaid = entries.filter((e) => e.payment_status === 'paid').reduce((s, e) => s + Number(e.amount), 0);
    const totalAdvanceReceived = entries.filter((e) => e.payment_status === 'advance').reduce((s, e) => s + Number(e.advance_amount ?? 0), 0);
    const totalAdvanceBalance = entries.filter((e) => e.payment_status === 'advance').reduce((s, e) => s + (Number(e.amount) - Number(e.advance_amount ?? 0)), 0);
    const totalPending = entries.filter((e) => e.payment_status === 'pending').reduce((s, e) => s + Number(e.amount), 0);
    const now = new Date();
    const monthlyPaid = entries.filter((e) => e.payment_status === 'paid' && new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear()).reduce((s, e) => s + Number(e.amount), 0);
    return { totalPaid, totalAdvanceReceived, totalAdvanceBalance, totalPending, monthlyPaid, count: entries.length };
  }, [entries]);

  const byPaymentStatus = useMemo(() => ({
    fullyPaid: entries.filter((e) => e.payment_status === 'paid'),
    advancePaid: entries.filter((e) => e.payment_status === 'advance'),
    notPaid: entries.filter((e) => e.payment_status === 'pending'),
  }), [entries]);

  const byService = useMemo(() => {
    const map = new Map<ServiceType, number>();
    entries.filter((e) => e.payment_status === 'paid').forEach((e) => map.set(e.service_type, (map.get(e.service_type) ?? 0) + Number(e.amount)));
    return Array.from(map.entries()).map(([key, value]) => ({
      label: SERVICE_LABELS[key],
      value,
      color: SERVICE_COLORS[key] ?? '#7653B8',
    }));
  }, [entries]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const val = entries.filter((e) => e.payment_status === 'paid' && new Date(e.date).getMonth() === m && new Date(e.date).getFullYear() === y).reduce((s, e) => s + Number(e.amount), 0);
      months.push({ label: d.toLocaleString('en-US', { month: 'short' }), value: val });
    }
    return months;
  }, [entries]);

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
        title="Revenue"
        subtitle="Track income from client projects"
        action={<Button onClick={openAdd}><Plus size={18} /> Add Revenue</Button>}
      />

      {entries.length === 0 ? (
        <div className="glass-card rounded-2xl p-8">
          <EmptyState
            icon={<DollarSign className="text-[#7653B8]" size={40} />}
            title="No revenue entries yet"
            description="Add revenue from client projects to track your income, payment status, and service breakdown."
            action={<Button onClick={openAdd}><Plus size={18} /> Add First Entry</Button>}
          />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-[#7653B8]/10"><DollarSign className="text-[#7653B8]" size={18} /></div><span className="text-sm text-[#6B6580]">Total Paid</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.totalPaid} prefix="₹" /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-2">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-amber-100"><TrendingUp className="text-amber-500" size={18} /></div><span className="text-sm text-[#6B6580]">This Month</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.monthlyPaid} prefix="₹" /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-blue-100"><DollarSign className="text-blue-500" size={18} /></div><span className="text-sm text-[#6B6580]">Advance Received</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.totalAdvanceReceived} prefix="₹" /></p>
              {stats.totalAdvanceBalance > 0 && <p className="text-xs text-[#9B95A8] mt-1">₹{stats.totalAdvanceBalance.toLocaleString('en-IN')} balance due</p>}
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-orange-100"><Calendar className="text-orange-500" size={18} /></div><span className="text-sm text-[#6B6580]">Not Paid</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.totalPending} prefix="₹" /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-[#7653B8]/10"><DollarSign className="text-[#7653B8]" size={18} /></div><span className="text-sm text-[#6B6580]">Total Entries</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={stats.count} /></p>
            </div>
          </div>

          {/* Payment status breakdown: who's fully paid, who paid advance only, who hasn't paid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-1">Fully Paid</h3>
              <p className="text-xs text-[#9B95A8] mb-4">{byPaymentStatus.fullyPaid.length} client{byPaymentStatus.fullyPaid.length === 1 ? '' : 's'}</p>
              {byPaymentStatus.fullyPaid.length === 0 ? (
                <p className="text-[#9B95A8] text-sm py-4 text-center">No fully paid entries yet</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {byPaymentStatus.fullyPaid.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b border-[#F0EEF8] pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-[#1F1B2E]">{entry.client_name}</p>
                        <p className="text-xs text-[#9B95A8]">{entry.project_name}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">{formatINR(Number(entry.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-1">Advance Paid</h3>
              <p className="text-xs text-[#9B95A8] mb-4">{byPaymentStatus.advancePaid.length} client{byPaymentStatus.advancePaid.length === 1 ? '' : 's'}</p>
              {byPaymentStatus.advancePaid.length === 0 ? (
                <p className="text-[#9B95A8] text-sm py-4 text-center">No advance-only entries yet</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {byPaymentStatus.advancePaid.map((entry) => {
                    const advance = Number(entry.advance_amount ?? 0);
                    const balance = Number(entry.amount) - advance;
                    return (
                      <div key={entry.id} className="border-b border-[#F0EEF8] pb-2 last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#1F1B2E]">{entry.client_name}</p>
                            <p className="text-xs text-[#9B95A8]">{entry.project_name}</p>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{formatINR(advance)}</span>
                        </div>
                        <p className="text-xs text-[#9B95A8] mt-0.5">₹{balance.toLocaleString('en-IN')} balance due of {formatINR(Number(entry.amount))}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-3">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-1">Not Paid</h3>
              <p className="text-xs text-[#9B95A8] mb-4">{byPaymentStatus.notPaid.length} client{byPaymentStatus.notPaid.length === 1 ? '' : 's'}</p>
              {byPaymentStatus.notPaid.length === 0 ? (
                <p className="text-[#9B95A8] text-sm py-4 text-center">No pending entries</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {byPaymentStatus.notPaid.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b border-[#F0EEF8] pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-[#1F1B2E]">{entry.client_name}</p>
                        <p className="text-xs text-[#9B95A8]">{entry.project_name}</p>
                      </div>
                      <span className="text-sm font-bold text-orange-600">{formatINR(Number(entry.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Revenue by Service</h3>
              {byService.length > 0 ? <DonutChart data={byService} /> : <p className="text-[#9B95A8] text-sm py-8 text-center">No paid revenue yet</p>}
            </div>
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
              <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Monthly Revenue (6 months)</h3>
              <BarChart data={monthlyData} />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">Revenue Entries</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-[#6B6580] border-b border-[#E8E5F0]">
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium">Service</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-[#F0EEF8] hover:bg-[#F8F7FC] transition-all">
                      <td className="py-3 text-sm text-[#1F1B2E] font-medium">{entry.client_name}</td>
                      <td className="py-3 text-sm text-[#6B6580]">{entry.project_name}</td>
                      <td className="py-3 text-sm text-[#7653B8]">{SERVICE_LABELS[entry.service_type]}</td>
                      <td className="py-3 text-sm font-bold text-[#1F1B2E]">{formatINR(Number(entry.amount))}</td>
                      <td className="py-3 text-sm text-[#6B6580]">{formatDate(entry.date)}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          entry.payment_status === 'paid' ? 'bg-green-100 text-green-700'
                          : entry.payment_status === 'advance' ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {entry.payment_status === 'paid' ? 'Paid' : entry.payment_status === 'advance' ? 'Advance' : 'Pending'}
                        </span>
                        {entry.payment_status === 'advance' && (
                          <p className="text-[11px] text-[#9B95A8] mt-1">{formatINR(Number(entry.advance_amount ?? 0))} received</p>
                        )}
                      </td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Revenue' : 'Add Revenue'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client Name"><TextInput value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required placeholder="Acme Corp" /></Field>
            <Field label="Project Name"><TextInput value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required placeholder="Logo Design" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Service Type">
              <Select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value as ServiceType })}>
                {Object.entries(SERVICE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Payment Status">
              <Select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as PaymentStatus })}>
                <option value="paid">Paid (Full)</option>
                <option value="advance">Advance Only</option>
                <option value="pending">Not Paid</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₹)"><TextInput type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
            <Field label="Date"><DateInput value={form.date} onChange={(v) => setForm({ ...form, date: v })} required /></Field>
          </div>
          {form.payment_status === 'advance' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Advance Amount Received (₹)">
                <TextInput type="number" min="0" step="0.01" value={form.advance_amount} onChange={(e) => setForm({ ...form, advance_amount: e.target.value })} required />
              </Field>
              <Field label="Balance Due">
                <div className="px-3 py-2.5 rounded-xl bg-[#F8F7FC] text-sm text-[#6B6580] font-medium">
                  ₹{Math.max(0, Number(form.amount) - Number(form.advance_amount)).toLocaleString('en-IN')}
                </div>
              </Field>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Revenue'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}