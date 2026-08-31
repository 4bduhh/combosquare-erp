import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProjectEntry, Employee, ServiceType, ProjectStatus } from '@/lib/types';
import { SERVICE_LABELS } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Field, TextInput, Select, Button } from '@/components/Form';
import { FolderKanban, Plus, Pencil, Trash2, Calendar, DollarSign, User, LayoutGrid, List } from 'lucide-react';
import { formatINR } from '@/lib/currency';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'To-Do', color: '#6B6580', bg: '#F0EEF8' },
  in_progress: { label: 'In Progress', color: '#7653B8', bg: '#EDE9F8' },
  completed: { label: 'Completed', color: '#22c55e', bg: '#DCFCE7' },
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectEntry | null>(null);
  const [form, setForm] = useState({
    client_name: '', project_name: '', service_type: 'branding' as ServiceType,
    assigned_employee_ids: [] as string[], start_date: '', deadline: '', status: 'todo' as ProjectStatus, amount: '0',
  });

  const load = async () => {
    const [proj, emp] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*'),
    ]);
    setProjects(proj.data ?? []);
    setEmployees(emp.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ client_name: '', project_name: '', service_type: 'branding', assigned_employee_ids: [], start_date: '', deadline: '', status: 'todo', amount: '0' });
    setModalOpen(true);
  };

  const openEdit = (proj: ProjectEntry) => {
    setEditing(proj);
    setForm({
      client_name: proj.client_name, project_name: proj.project_name, service_type: proj.service_type,
      assigned_employee_ids: proj.assigned_employee_ids ?? [], start_date: proj.start_date ?? '',
      deadline: proj.deadline ?? '', status: proj.status, amount: String(proj.amount),
    });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      client_name: form.client_name, project_name: form.project_name, service_type: form.service_type,
      assigned_employee_ids: form.assigned_employee_ids, start_date: form.start_date || null,
      deadline: form.deadline || null, status: form.status, amount: Number(form.amount),
    };
    if (editing) {
      await supabase.from('projects').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('projects').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await supabase.from('projects').delete().eq('id', id);
    load();
  };

  const toggleStatus = async (proj: ProjectEntry, status: ProjectStatus) => {
    await supabase.from('projects').update({ status }).eq('id', proj.id);
    load();
  };

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#E8E5F0] border-t-[#7653B8] rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  const columns: { status: ProjectStatus; items: ProjectEntry[] }[] = [
    { status: 'todo', items: projects.filter((p) => p.status === 'todo') },
    { status: 'in_progress', items: projects.filter((p) => p.status === 'in_progress') },
    { status: 'completed', items: projects.filter((p) => p.status === 'completed') },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-3">
            <div className="flex p-1 rounded-xl bg-[#F0EEF8]">
              <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-white text-[#7653B8] shadow-sm' : 'text-[#9B95A8]'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white text-[#7653B8] shadow-sm' : 'text-[#9B95A8]'}`}><List size={18} /></button>
            </div>
            <Button onClick={openAdd}><Plus size={18} /> Add Project</Button>
          </div>
        }
      />

      {projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-8">
          <EmptyState
            icon={<FolderKanban className="text-[#7653B8]" size={40} />}
            title="No projects yet"
            description="Create projects, assign team members, and track progress from To-Do through to Completed."
            action={<Button onClick={openAdd}><Plus size={18} /> Add First Project</Button>}
          />
        </div>
      ) : view === 'kanban' ? (
        /* Kanban */
        <div className="grid md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const cfg = STATUS_CONFIG[col.status];
            return (
              <div key={col.status} className="glass-card rounded-2xl p-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
                    <h3 className="font-bold text-[#1F1B2E]">{cfg.label}</h3>
                  </div>
                  <span className="text-sm text-[#6B6580] bg-[#F0EEF8] px-2 py-0.5 rounded-full">{col.items.length}</span>
                </div>
                <div className="space-y-3">
                  {col.items.map((proj) => (
                    <div key={proj.id} className="bg-[#F8F7FC] rounded-xl p-4 border border-[#E8E5F0] hover:border-[#C4B5FD] transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#1F1B2E] text-sm">{proj.project_name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(proj)} className="p-1.5 rounded-lg text-[#9B95A8] hover:text-[#7653B8] hover:bg-[#F0EEF8]"><Pencil size={14} /></button>
                          <button onClick={() => remove(proj.id)} className="p-1.5 rounded-lg text-[#9B95A8] hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p className="text-xs text-[#7653B8] mb-3">{SERVICE_LABELS[proj.service_type]}</p>
                      <div className="space-y-1.5 text-xs text-[#6B6580]">
                        <div className="flex items-center gap-1.5"><User size={12} /> {proj.client_name}</div>
                        {proj.deadline && <div className="flex items-center gap-1.5"><Calendar size={12} /> Due {new Date(proj.deadline).toLocaleDateString()}</div>}
                        <div className="flex items-center gap-1.5"><DollarSign size={12} /> {formatINR(Number(proj.amount))}</div>
                      </div>
                      {proj.assigned_employee_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {proj.assigned_employee_ids.slice(0, 3).map((id) => (
                            <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-[#7653B8]/10 text-[#7653B8]">{empName(id).split(' ')[0]}</span>
                          ))}
                          {proj.assigned_employee_ids.length > 3 && <span className="text-xs text-[#9B95A8]">+{proj.assigned_employee_ids.length - 3}</span>}
                        </div>
                      )}
                      {/* Quick status switch */}
                      <div className="flex gap-1 mt-3 pt-3 border-t border-[#E8E5F0]">
                        {(['todo', 'in_progress', 'completed'] as ProjectStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => toggleStatus(proj, s)}
                            className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${proj.status === s ? 'font-bold' : 'text-[#9B95A8] hover:text-[#6B6580]'}`}
                            style={proj.status === s ? { background: cfg.bg, color: cfg.color } : {}}
                          >
                            {STATUS_CONFIG[s].label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {col.items.length === 0 && <p className="text-xs text-[#9B95A8] text-center py-6">No projects</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[#6B6580] border-b border-[#E8E5F0]">
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Deadline</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => {
                  const cfg = STATUS_CONFIG[proj.status];
                  return (
                    <tr key={proj.id} className="border-b border-[#F0EEF8] hover:bg-[#F8F7FC] transition-all">
                      <td className="py-3 text-sm text-[#1F1B2E] font-medium">{proj.project_name}</td>
                      <td className="py-3 text-sm text-[#6B6580]">{proj.client_name}</td>
                      <td className="py-3 text-sm text-[#7653B8]">{SERVICE_LABELS[proj.service_type]}</td>
                      <td className="py-3 text-sm font-bold text-[#1F1B2E]">{formatINR(Number(proj.amount))}</td>
                      <td className="py-3 text-sm text-[#6B6580]">{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : '—'}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(proj)} className="p-2 rounded-lg text-[#9B95A8] hover:text-[#7653B8] hover:bg-[#F0EEF8] transition-all"><Pencil size={16} /></button>
                          <button onClick={() => remove(proj.id)} className="p-2 rounded-lg text-[#9B95A8] hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project Name"><TextInput value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required placeholder="Logo Design" /></Field>
            <Field label="Client Name"><TextInput value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required placeholder="Acme Corp" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Service Type">
              <Select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value as ServiceType })}>
                {Object.entries(SERVICE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
                <option value="todo">To-Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
            </Field>
          </div>
          <Field label="Assigned Team Members">
            <div className="max-h-32 overflow-y-auto space-y-2 p-3 rounded-xl bg-[#F8F7FC] border border-[#D5D0E5]">
              {employees.length === 0 ? <p className="text-sm text-[#9B95A8]">Add employees first to assign them.</p> : employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.assigned_employee_ids.includes(emp.id)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, assigned_employee_ids: [...form.assigned_employee_ids, emp.id] });
                      else setForm({ ...form, assigned_employee_ids: form.assigned_employee_ids.filter((id) => id !== emp.id) });
                    }}
                    className="accent-[#7653B8]"
                  />
                  <span className="text-sm text-[#1F1B2E]">{emp.name} — {emp.role}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date"><TextInput type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Deadline"><TextInput type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
          </div>
          <Field label="Project Value (₹)"><TextInput type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Project'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
