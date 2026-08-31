import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { TargetEntry, RevenueEntry, ProjectEntry } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Field, TextInput, Button } from '@/components/Form';
import { ProgressRing, ProgressBar } from '@/components/Charts';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Target as TargetIcon, Plus, Pencil, Trash2, DollarSign, FolderKanban, Users } from 'lucide-react';
import { formatINR } from '@/lib/currency';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function TargetsPage() {
  const [targets, setTargets] = useState<TargetEntry[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TargetEntry | null>(null);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    revenue_target: '0', projects_target: '0', clients_target: '0',
  });

  const load = async () => {
    const [tgt, rev, proj] = await Promise.all([
      supabase.from('targets').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('revenue').select('*'),
      supabase.from('projects').select('*'),
    ]);
    setTargets(tgt.data ?? []);
    setRevenue(rev.data ?? []);
    setProjects(proj.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), revenue_target: '0', projects_target: '0', clients_target: '0' });
    setModalOpen(true);
  };

  const openEdit = (tgt: TargetEntry) => {
    setEditing(tgt);
    setForm({ month: tgt.month, year: tgt.year, revenue_target: String(tgt.revenue_target), projects_target: String(tgt.projects_target), clients_target: String(tgt.clients_target) });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      month: Number(form.month), year: Number(form.year),
      revenue_target: Number(form.revenue_target), projects_target: Number(form.projects_target), clients_target: Number(form.clients_target),
    };
    if (editing) {
      await supabase.from('targets').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('targets').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this target?')) return;
    await supabase.from('targets').delete().eq('id', id);
    load();
  };

  const actuals = useMemo(() => {
    const map = new Map<string, { revenue: number; projects: number; clients: number }>();
    targets.forEach((t) => {
      const key = `${t.year}-${t.month}`;
      const rev = revenue.filter((r) => r.payment_status === 'paid' && new Date(r.date).getMonth() === t.month - 1 && new Date(r.date).getFullYear() === t.year).reduce((s, r) => s + Number(r.amount), 0);
      const proj = projects.filter((p) => p.status === 'completed' && new Date(p.created_at).getMonth() === t.month - 1 && new Date(p.created_at).getFullYear() === t.year).length;
      const clients = new Set(revenue.filter((r) => new Date(r.date).getMonth() === t.month - 1 && new Date(r.date).getFullYear() === t.year).map((r) => r.client_name)).size;
      map.set(key, { revenue: rev, projects: proj, clients });
    });
    return map;
  }, [targets, revenue, projects]);

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
        title="Monthly Targets"
        subtitle="Set and track company-wide goals"
        action={<Button onClick={openAdd}><Plus size={18} /> Add Target</Button>}
      />

      {targets.length === 0 ? (
        <div className="glass-card rounded-2xl p-8">
          <EmptyState
            icon={<TargetIcon className="text-[#7653B8]" size={40} />}
            title="No targets set yet"
            description="Set monthly targets for revenue, projects, and new clients to track your company's performance."
            action={<Button onClick={openAdd}><Plus size={18} /> Set First Target</Button>}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {targets.map((tgt, i) => {
            const actual = actuals.get(`${tgt.year}-${tgt.month}`) ?? { revenue: 0, projects: 0, clients: 0 };
            return (
              <div key={tgt.id} className={`glass-card glass-card-hover rounded-2xl p-6 animate-fade-in-up stagger-${(i % 6) + 1}`}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-[#1F1B2E]">{MONTH_NAMES[tgt.month - 1]} {tgt.year}</h3>
                    <p className="text-sm text-[#9B95A8]">Monthly Target</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(tgt)} className="p-2 rounded-lg text-[#9B95A8] hover:text-[#7653B8] hover:bg-[#F0EEF8] transition-all"><Pencil size={16} /></button>
                    <button onClick={() => remove(tgt.id)} className="p-2 rounded-lg text-[#9B95A8] hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-5">
                  <ProgressRing value={actual.revenue} max={Number(tgt.revenue_target)} size={120} label="Revenue" />
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={14} className="text-[#7653B8]" />
                        <span className="text-sm text-[#6B6580]">Revenue</span>
                      </div>
                      <ProgressBar value={actual.revenue} max={Number(tgt.revenue_target)} label="" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FolderKanban size={14} className="text-[#7653B8]" />
                        <span className="text-sm text-[#6B6580]">Projects</span>
                      </div>
                      <ProgressBar value={actual.projects} max={tgt.projects_target} label="" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-[#7653B8]" />
                        <span className="text-sm text-[#6B6580]">New Clients</span>
                      </div>
                      <ProgressBar value={actual.clients} max={tgt.clients_target} label="" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#E8E5F0]">
                  <div className="text-center">
                    <p className="text-xs text-[#9B95A8]">Revenue</p>
                    <p className="font-bold text-[#1F1B2E] text-sm"><AnimatedCounter value={actual.revenue} prefix="₹" /> / <span className="text-[#9B95A8]">{formatINR(Number(tgt.revenue_target))}</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9B95A8]">Projects</p>
                    <p className="font-bold text-[#1F1B2E] text-sm">{actual.projects} / <span className="text-[#9B95A8]">{tgt.projects_target}</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9B95A8]">Clients</p>
                    <p className="font-bold text-[#1F1B2E] text-sm">{actual.clients} / <span className="text-[#9B95A8]">{tgt.clients_target}</span></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Target' : 'Add Monthly Target'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Month">
              <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7FC] border border-[#D5D0E5] text-[#1F1B2E] outline-none focus:border-[#7653B8] cursor-pointer">
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Year"><TextInput type="number" min="2020" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required /></Field>
          </div>
          <Field label="Revenue Target (₹)"><TextInput type="number" min="0" step="0.01" value={form.revenue_target} onChange={(e) => setForm({ ...form, revenue_target: e.target.value })} required /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Projects Target"><TextInput type="number" min="0" value={form.projects_target} onChange={(e) => setForm({ ...form, projects_target: e.target.value })} required /></Field>
            <Field label="New Clients Target"><TextInput type="number" min="0" value={form.clients_target} onChange={(e) => setForm({ ...form, clients_target: e.target.value })} required /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Target'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
