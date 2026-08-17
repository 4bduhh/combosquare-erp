import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Employee, CommissionType } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Field, TextInput, Select, Button } from '@/components/Form';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { PhotoDropzone } from '@/components/PhotoDropzone';
import { formatINR } from '@/lib/currency';
import { Users, Plus, Pencil, Trash2, Mail, Phone, Calendar, Search, Briefcase, Award, Target as TargetIcon } from 'lucide-react';

const ROLES = [
  'Graphic Designer', 'Web Developer', 'App Developer', 'Video Editor', 'Branding Specialist', 'Project Manager', 'Other',
];

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    name: '', role: ROLES[0], email: '', phone: '', photo_url: '', joining_date: '',
    salary: '0', commission_type: 'percentage' as CommissionType, commission_value: '0', monthly_target: '0',
  });

  const load = async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', role: ROLES[0], email: '', phone: '', photo_url: '', joining_date: '', salary: '0', commission_type: 'percentage', commission_value: '0', monthly_target: '0' });
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      name: emp.name, role: emp.role, email: emp.email ?? '', phone: emp.phone ?? '', photo_url: emp.photo_url ?? '',
      joining_date: emp.joining_date ?? '', salary: String(emp.salary), commission_type: emp.commission_type,
      commission_value: String(emp.commission_value), monthly_target: String(emp.monthly_target),
    });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, role: form.role, email: form.email || null, phone: form.phone || null,
      photo_url: form.photo_url || null, joining_date: form.joining_date || null,
      salary: Number(form.salary), commission_type: form.commission_type,
      commission_value: Number(form.commission_value), monthly_target: Number(form.monthly_target),
    };
    if (editing) {
      await supabase.from('employees').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('employees').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    await supabase.from('employees').delete().eq('id', id);
    load();
  };

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

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
        title="Employees"
        subtitle={`${employees.length} team member${employees.length !== 1 ? 's' : ''}`}
        action={<Button onClick={openAdd}><Plus size={18} /> Add Employee</Button>}
      />

      {employees.length === 0 ? (
        <div className="glass-card rounded-2xl p-8">
          <EmptyState
            icon={<Users className="text-[#7653B8]" size={40} />}
            title="No employees yet"
            description="Add your team members to track their roles, salaries, commissions, and performance."
            action={<Button onClick={openAdd}><Plus size={18} /> Add Your First Employee</Button>}
          />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B95A8]" size={18} />
              <TextInput placeholder="Search by name or role..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:w-56">
              <option value="all">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp, i) => (
              <div key={emp.id} className={`glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-${(i % 6) + 1}`}>
                <div className="flex items-start gap-4 mb-4">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt={emp.name} className="w-14 h-14 rounded-xl object-cover border border-[#E8E5F0]" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-peach-gradient flex items-center justify-center text-white font-bold text-lg">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1F1B2E] truncate">{emp.name}</h3>
                    <p className="text-sm text-[#7653B8] truncate">{emp.role}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(emp)} className="p-2 rounded-lg text-[#9B95A8] hover:text-[#7653B8] hover:bg-[#F0EEF8] transition-all">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => remove(emp.id)} className="p-2 rounded-lg text-[#9B95A8] hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {emp.email && <div className="flex items-center gap-2 text-[#6B6580]"><Mail size={14} className="shrink-0" /><span className="truncate">{emp.email}</span></div>}
                  {emp.phone && <div className="flex items-center gap-2 text-[#6B6580]"><Phone size={14} className="shrink-0" /><span>{emp.phone}</span></div>}
                  {emp.joining_date && <div className="flex items-center gap-2 text-[#6B6580]"><Calendar size={14} className="shrink-0" /><span>{new Date(emp.joining_date).toLocaleDateString()}</span></div>}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#E8E5F0]">
                  <div className="text-center">
                    <p className="text-xs text-[#9B95A8] flex items-center justify-center gap-1"><Briefcase size={11} /> Salary</p>
                    <p className="font-bold text-[#1F1B2E] text-sm">{formatINR(Number(emp.salary))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9B95A8] flex items-center justify-center gap-1"><Award size={11} /> Comm.</p>
                    <p className="font-bold text-[#1F1B2E] text-sm">{emp.commission_type === 'percentage' ? `${emp.commission_value}%` : formatINR(Number(emp.commission_value))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9B95A8] flex items-center justify-center gap-1"><TargetIcon size={11} /> Target</p>
                    <p className="font-bold text-[#1F1B2E] text-sm">{emp.monthly_target}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Full Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role / Designation">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Joining Date"><TextInput type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@combosquare.com" /></Field>
            <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" /></Field>
          </div>
          <PhotoDropzone value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} label="Employee Photo" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly Salary (₹)"><TextInput type="number" min="0" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} required /></Field>
            <Field label="Monthly Target (projects)"><TextInput type="number" min="0" value={form.monthly_target} onChange={(e) => setForm({ ...form, monthly_target: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Commission Type">
              <Select value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value as CommissionType })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </Select>
            </Field>
            <Field label={form.commission_type === 'percentage' ? 'Commission %' : 'Commission ₹'}>
              <TextInput type="number" min="0" step="0.01" value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Employee'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
